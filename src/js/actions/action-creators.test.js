import datastoreSettingService from "../services/datastore-setting";
import actionCreators from "./action-creators";
import {
	SET_CONNECTION_AUTHENTICATION,
	SET_GATEWAY_CLUSTER_SELECTION,
	SET_SERVER_INFO,
} from "./action-types";

let mockSettingsDatastore;
let mockUserId;

jest.mock("../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			settingsDatastore: mockSettingsDatastore,
			user: { userId: mockUserId },
		}),
	}),
}));

jest.mock("../services/datastore-setting", () => ({
	__esModule: true,
	default: {
		saveSettingsDatastore: jest.fn(),
		serializeSettingsDatastore: jest.fn((settings) => settings),
	},
}));

describe("Action creator: server info recovery key boundary", () => {
	it("defaults the explicit trusted recovery key to disabled", () => {
		const dispatch = jest.fn();
		const info = { admin_recovery_public_key: "a".repeat(64) };

		actionCreators.setServerInfo(info, "verify-key")(dispatch);

		expect(dispatch).toHaveBeenCalledWith({
			type: SET_SERVER_INFO,
			info,
			verifyKey: "verify-key",
			adminRecoveryPublicKey: "",
		});
	});
});

describe("Action creator: connection authentication", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUserId = "user-a";
		mockSettingsDatastore = {
			showSSHConnection: false,
			showRDPConnection: false,
			showVNCConnection: false,
			connectionAuthentication: {
				schema_version: 1,
				by_connection_secret_id: {
					existing: {
						secret_id: "old-secret",
						secret_key: "old-key",
						type: "application_password",
					},
				},
			},
			gatewayClusterSelection: {
				schema_version: 1,
				by_connection_secret_id: { existing: "cluster-a" },
			},
		};
	});

	it("persists an immutable map update before dispatch and returns the result", async () => {
		let resolvePersistence;
		const persistence = new Promise((resolve) => {
			resolvePersistence = resolve;
		});
		datastoreSettingService.saveSettingsDatastore.mockReturnValue(persistence);
		const authentication = {
			secret_id: "secret",
			secret_key: "secret-key",
			type: "ssh_own_key",
			username: "user",
		};
		const dispatch = jest.fn();

		const resultPromise = actionCreators.setConnectionAuthentication(
			"connection",
			authentication,
		)(dispatch);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(dispatch).not.toHaveBeenCalled();
		expect(
			datastoreSettingService.serializeSettingsDatastore.mock.calls[0][0]
				.connectionAuthentication.by_connection_secret_id,
		).toEqual({
			existing:
				mockSettingsDatastore.connectionAuthentication.by_connection_secret_id
					.existing,
			connection: authentication,
		});
		expect(
			mockSettingsDatastore.connectionAuthentication.by_connection_secret_id,
		).not.toHaveProperty("connection");

		resolvePersistence("saved");
		await expect(resultPromise).resolves.toBe("saved");
		expect(dispatch).toHaveBeenCalledWith({
			type: SET_CONNECTION_AUTHENTICATION,
			connectionAuthentication: {
				schema_version: 1,
				by_connection_secret_id: {
					existing:
						mockSettingsDatastore.connectionAuthentication
							.by_connection_secret_id.existing,
					connection: authentication,
				},
			},
		});
	});

	it("deletes one entry and does not dispatch when persistence fails", async () => {
		const error = new Error("save failed");
		datastoreSettingService.saveSettingsDatastore.mockRejectedValue(error);
		const dispatch = jest.fn();

		const resultPromise = actionCreators.setConnectionAuthentication(
			"existing",
			null,
		)(dispatch);
		const rejection = expect(resultPromise).rejects.toBe(error);
		await new Promise((resolve) => setTimeout(resolve, 0));

		await rejection;
		expect(dispatch).not.toHaveBeenCalled();
		expect(
			datastoreSettingService.serializeSettingsDatastore.mock.calls[0][0]
				.connectionAuthentication.by_connection_secret_id,
		).toEqual({});
	});

	it("serializes concurrent connection updates without losing entries", async () => {
		let resolveFirst;
		const firstPersistence = new Promise((resolve) => {
			resolveFirst = resolve;
		});
		datastoreSettingService.saveSettingsDatastore
			.mockReturnValueOnce(firstPersistence)
			.mockResolvedValueOnce("second saved");
		const dispatch = jest.fn((dispatchedAction) => {
			mockSettingsDatastore.connectionAuthentication =
				dispatchedAction.connectionAuthentication;
		});

		const first = actionCreators.setConnectionAuthentication("first", {
			type: "application_password",
			secret_id: "first-secret",
			secret_key: "first-key",
		})(dispatch);
		const second = actionCreators.setConnectionAuthentication("second", {
			type: "application_password",
			secret_id: "second-secret",
			secret_key: "second-key",
		})(dispatch);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(datastoreSettingService.saveSettingsDatastore).toHaveBeenCalledTimes(
			1,
		);

		resolveFirst("first saved");
		await first;
		await second;

		const secondSerializedState =
			datastoreSettingService.serializeSettingsDatastore.mock.calls[1][0];
		expect(
			secondSerializedState.connectionAuthentication.by_connection_secret_id,
		).toMatchObject({
			first: { secret_id: "first-secret", secret_key: "first-key" },
			second: { secret_id: "second-secret", secret_key: "second-key" },
		});
	});

	it("does not run a queued update after the active user changes", async () => {
		let resolveFirst;
		const firstPersistence = new Promise((resolve) => {
			resolveFirst = resolve;
		});
		datastoreSettingService.saveSettingsDatastore.mockReturnValue(
			firstPersistence,
		);
		const dispatch = jest.fn();

		const first = actionCreators.setConnectionAuthentication("first", {
			type: "application_password",
			secret_id: "first-secret",
			secret_key: "first-key",
		})(dispatch);
		const second = actionCreators.setConnectionAuthentication("second", {
			type: "application_password",
			secret_id: "second-secret",
			secret_key: "second-key",
		})(dispatch);
		await new Promise((resolve) => setTimeout(resolve, 0));

		mockUserId = "user-b";
		resolveFirst("first saved");
		await expect(first).rejects.toEqual({
			code: "SETTINGS_PERSISTENCE_FAILED",
		});
		await expect(second).rejects.toEqual({
			code: "SETTINGS_PERSISTENCE_FAILED",
		});

		expect(datastoreSettingService.saveSettingsDatastore).toHaveBeenCalledTimes(
			1,
		);
		expect(dispatch).not.toHaveBeenCalled();
	});

	it("rejects a settings write whose datastore failure was swallowed", async () => {
		datastoreSettingService.saveSettingsDatastore.mockResolvedValue(undefined);
		const dispatch = jest.fn();

		await expect(
			actionCreators.setConnectionAuthentication("connection", {
				type: "application_password",
				secret_id: "credential",
				secret_key: "credential-key",
			})(dispatch),
		).rejects.toEqual({ code: "SETTINGS_PERSISTENCE_FAILED" });
		expect(dispatch).not.toHaveBeenCalled();
	});
});

describe("Action creator: gateway cluster selection", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUserId = "user-a";
		mockSettingsDatastore = {
			gatewayClusterSelection: {
				schema_version: 1,
				by_connection_secret_id: { existing: "cluster-a" },
			},
		};
	});

	it("persists through the settings queue before dispatching", async () => {
		datastoreSettingService.saveSettingsDatastore.mockResolvedValue("saved");
		const dispatch = jest.fn();

		await expect(
			actionCreators.setGatewayClusterSelection(
				"connection",
				"cluster-b",
			)(dispatch),
		).resolves.toBe("saved");
		expect(dispatch).toHaveBeenCalledWith({
			type: SET_GATEWAY_CLUSTER_SELECTION,
			gatewayClusterSelection: {
				schema_version: 1,
				by_connection_secret_id: {
					existing: "cluster-a",
					connection: "cluster-b",
				},
			},
		});
	});

	it("does not dispatch a persisted selection after the active user changes", async () => {
		let resolvePersistence;
		datastoreSettingService.saveSettingsDatastore.mockReturnValue(
			new Promise((resolve) => {
				resolvePersistence = resolve;
			}),
		);
		const dispatch = jest.fn();
		const result = actionCreators.setGatewayClusterSelection(
			"connection",
			"cluster-b",
		)(dispatch);
		await new Promise((resolve) => setTimeout(resolve, 0));

		mockUserId = "user-b";
		resolvePersistence("saved");
		await expect(result).rejects.toEqual({
			code: "SETTINGS_PERSISTENCE_FAILED",
		});
		expect(dispatch).not.toHaveBeenCalled();
	});
});
