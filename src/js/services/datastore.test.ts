import rootReducer from "../reducers";
import apiClient from "./api-client";
import datastoreService from "./datastore";
import * as storeService from "./store";

describe("Service: datastoreService - failed overview requests", () => {
	let userNumber = 0;

	beforeEach(() => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		state.user.userId = `overview-retry-${++userNumber}`;
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
			dispatch: jest.fn(),
		} as unknown as ReturnType<typeof storeService.getStore>);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("shares an in-flight request but retries after a network failure", async () => {
		const overview = {
			datastores: [
				{
					id: "password-store",
					type: "password",
					description: "Default",
					is_default: true,
				},
			],
		};
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockRejectedValueOnce({ errors: ["SERVER_OFFLINE"] })
			.mockResolvedValueOnce({ data: overview });

		const first = datastoreService.getDatastoreOverview();
		expect(datastoreService.getDatastoreOverview()).toBe(first);
		await expect(first).resolves.toBeUndefined();
		await expect(datastoreService.getDatastoreOverview()).resolves.toEqual(
			overview,
		);
		await expect(datastoreService.getDatastoreOverview()).resolves.toEqual(
			overview,
		);
		expect(read).toHaveBeenCalledTimes(2);
	});

	it("does not fetch or create a datastore when its overview could not be loaded", async () => {
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockRejectedValue({ errors: ["SERVER_OFFLINE"] });
		const create = jest.spyOn(apiClient, "createDatastore");

		await expect(
			datastoreService.getDatastore("password"),
		).resolves.toBeUndefined();
		expect(read).toHaveBeenCalledTimes(1);
		expect(create).not.toHaveBeenCalled();
	});

	it("does not fetch or create a datastore after a failed fresh overview lookup", async () => {
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockResolvedValueOnce({ data: { datastores: [] } })
			.mockRejectedValueOnce({ errors: ["SERVER_OFFLINE"] });
		const create = jest.spyOn(apiClient, "createDatastore");

		await expect(
			datastoreService.getDatastore("password"),
		).resolves.toBeUndefined();
		expect(read).toHaveBeenCalledTimes(2);
		expect(create).not.toHaveBeenCalled();
	});
});
