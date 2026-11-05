jest.mock("./services/store", () => {
	throw new Error(
		"The offscreen key host must not initialize the application store.",
	);
});

describe("offscreen vault lock entry point", () => {
	afterEach(() => jest.restoreAllMocks());

	it("announces the key host without loading the Redux application", () => {
		const post = jest.spyOn(BroadcastChannel.prototype, "postMessage");
		require("./lock-offscreen");
		expect(post).toHaveBeenCalledWith({ event: "host-ready" });
	});
});
