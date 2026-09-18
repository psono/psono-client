import storage from "./storage";

jest.mock("./storage", () => ({
	__esModule: true,
	default: {
		findKey: jest.fn(),
	},
}));

globalThis.BroadcastChannel = class
	extends EventTarget
	implements BroadcastChannel
{
	onmessage: BroadcastChannel["onmessage"] = null;
	onmessageerror: BroadcastChannel["onmessageerror"] = null;
	constructor(public readonly name: string) {
		super();
	}
	postMessage(_message: unknown) {}
	close() {}
};

const accountService =
	jest.requireActual<typeof import("./account")>("./account").default;
const findKeyMock = storage.findKey as jest.MockedFunction<
	typeof storage.findKey
>;

describe("Service: account session", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("recognizes the session persisted for the active account", async () => {
		findKeyMock.mockResolvedValue(
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
		findKeyMock.mockResolvedValue(
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
		findKeyMock.mockResolvedValue(null);

		await expect(accountService.isCurrentSession("token")).resolves.toBe(false);
	});
});
