import type { AppAction } from "../../types/actions";
import type { WriteResult } from "../../types/datastore";
import type { SettingsState } from "../../types/state";
import datastoreSettingService from "../services/datastore-setting";
import actionCreators from "./action-creators";
import {
	SET_CONNECTION_AUTHENTICATION,
	SET_GATEWAY_CLUSTER_SELECTION,
	SET_SERVER_INFO,
} from "./action-types";

let mockSettingsDatastore: Partial<SettingsState>;
let mockUserId: string;

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
		serializeSettingsDatastore: jest.fn(
			(settings: Partial<SettingsState>) => settings,
		),
	},
}));

const mockSaveSettingsDatastore = jest.mocked(
	datastoreSettingService.saveSettingsDatastore,
);
const mockSerializeSettingsDatastore = jest.mocked(
	datastoreSettingService.serializeSettingsDatastore,
);

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
		let resolvePersistence!: (value: WriteResult) => void;
		const persistence = new Promise<WriteResult>((resolve) => {
			resolvePersistence = resolve;
		});
		mockSaveSettingsDatastore.mockReturnValue(persistence);
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
			mockSerializeSettingsDatastore.mock.calls[0][0].connectionAuthentication!
				.by_connection_secret_id,
		).toEqual({
			existing:
				mockSettingsDatastore.connectionAuthentication!.by_connection_secret_id
					.existing,
			connection: authentication,
		});
		expect(
			mockSettingsDatastore.connectionAuthentication!.by_connection_secret_id,
		).not.toHaveProperty("connection");

		const saved: WriteResult = { write_date: "saved" };
		resolvePersistence(saved);
		await expect(resultPromise).resolves.toBe(saved);
		expect(dispatch).toHaveBeenCalledWith({
			type: SET_CONNECTION_AUTHENTICATION,
			connectionAuthentication: {
				schema_version: 1,
				by_connection_secret_id: {
					existing:
						mockSettingsDatastore.connectionAuthentication!
							.by_connection_secret_id.existing,
					connection: authentication,
				},
			},
		});
	});

	it("deletes one entry and does not dispatch when persistence fails", async () => {
		const error = new Error("save failed");
		mockSaveSettingsDatastore.mockRejectedValue(error);
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
			mockSerializeSettingsDatastore.mock.calls[0][0].connectionAuthentication!
				.by_connection_secret_id,
		).toEqual({});
	});

	it("serializes concurrent connection updates without losing entries", async () => {
		let resolveFirst!: (value: WriteResult) => void;
		const firstPersistence = new Promise<WriteResult>((resolve) => {
			resolveFirst = resolve;
		});
		mockSaveSettingsDatastore
			.mockReturnValueOnce(firstPersistence)
			.mockResolvedValueOnce({ write_date: "second saved" });
		const dispatch = jest.fn();
		dispatch.mockImplementation((dispatchedAction: AppAction) => {
			if (dispatchedAction.type === SET_CONNECTION_AUTHENTICATION) {
				mockSettingsDatastore.connectionAuthentication =
					dispatchedAction.connectionAuthentication;
			}
			return dispatchedAction;
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

		resolveFirst({ write_date: "first saved" });
		await first;
		await second;

		const secondSerializedState =
			mockSerializeSettingsDatastore.mock.calls[1][0];
		expect(
			secondSerializedState.connectionAuthentication!.by_connection_secret_id,
		).toMatchObject({
			first: { secret_id: "first-secret", secret_key: "first-key" },
			second: { secret_id: "second-secret", secret_key: "second-key" },
		});
	});

	it("does not run a queued update after the active user changes", async () => {
		let resolveFirst!: (value: WriteResult) => void;
		const firstPersistence = new Promise<WriteResult>((resolve) => {
			resolveFirst = resolve;
		});
		mockSaveSettingsDatastore.mockReturnValue(firstPersistence);
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
		resolveFirst({ write_date: "first saved" });
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
		mockSaveSettingsDatastore.mockResolvedValue(undefined);
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
		const saved: WriteResult = { write_date: "saved" };
		mockSaveSettingsDatastore.mockResolvedValue(saved);
		const dispatch = jest.fn();

		await expect(
			actionCreators.setGatewayClusterSelection(
				"connection",
				"cluster-b",
			)(dispatch),
		).resolves.toBe(saved);
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
		let resolvePersistence!: (value: WriteResult) => void;
		mockSaveSettingsDatastore.mockReturnValue(
			new Promise<WriteResult>((resolve) => {
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
		resolvePersistence({ write_date: "saved" });
		await expect(result).rejects.toEqual({
			code: "SETTINGS_PERSISTENCE_FAILED",
		});
		expect(dispatch).not.toHaveBeenCalled();
	});
});
