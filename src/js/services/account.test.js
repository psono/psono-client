import storage from "./storage";

jest.mock("./storage", () => ({
	__esModule: true,
	default: {
		findKey: jest.fn(),
	},
}));

global.BroadcastChannel = class {
	postMessage() {}
};

const accountService = require("./account").default;

describe("Service: account session", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("recognizes the session persisted for the active account", async () => {
		storage.findKey.mockResolvedValue(
			JSON.stringify({
				user: JSON.stringify({
					token: "current-token",
					sessionSecretKey: "current-session-key",
				}),
			}),
		);

		await expect(
			accountService.isCurrentSession("current-token"),
		).resolves.toBe(true);
		expect(storage.findKey).toHaveBeenCalledWith("state", "persist:client");
	});

	it("rejects credentials from a stale session", async () => {
		storage.findKey.mockResolvedValue(
			JSON.stringify({
				user: JSON.stringify({
					token: "new-token",
					sessionSecretKey: "new-session-key",
				}),
			}),
		);

		await expect(accountService.isCurrentSession("old-token")).resolves.toBe(
			false,
		);
	});

	it("fails closed when persisted session state is unavailable", async () => {
		storage.findKey.mockResolvedValue(null);

		await expect(accountService.isCurrentSession("token")).resolves.toBe(false);
	});
});
