import browserClient from "./browser-client";
import passkeySelectorService from "./passkey-selector";

describe("passkey selector", () => {
	it("only accepts an allowed index from the requesting top frame and active session", async () => {
		const emitFrame = jest
			.spyOn(browserClient, "emitFrame")
			.mockImplementation(() => {});
		const selection = passkeySelectorService.select(
			17,
			"https://example.com",
			"https://example.com",
			["First", "Second"],
			10000,
		);
		const show = emitFrame.mock.calls.find(
			(call) => call[2] === "show-passkey-selector",
		);
		const id = (show?.[3] as { id: string }).id;
		const sender = {
			tab: { id: 17, url: "https://example.com/login" },
			url: "https://example.com/login",
			frameId: 0,
		};
		passkeySelectorService.onSelect(
			{ data: { id, index: 1 } },
			{ ...sender, frameId: 1 },
		);
		passkeySelectorService.onSelect(
			{ data: { id, index: 1 } },
			{ ...sender, url: "https://attacker.example" },
		);
		passkeySelectorService.onSelect(
			{ data: { id: "wrong", index: 1 } },
			sender,
		);
		passkeySelectorService.onSelect({ data: { id, index: -1 } }, sender);
		passkeySelectorService.onSelect({ data: { id, index: 2 } }, sender);
		passkeySelectorService.onSelect({ data: { id, index: 1 } }, sender);
		expect(await selection).toBe(1);
		passkeySelectorService.onSelect({ data: { id, index: 0 } }, sender);
		expect(
			emitFrame.mock.calls.filter(
				(call) => call[2] === "hide-passkey-selector",
			),
		).toHaveLength(1);
	});

	it("rejects a cancelled selection without selecting a credential", async () => {
		const emitFrame = jest
			.spyOn(browserClient, "emitFrame")
			.mockImplementation(() => {});
		emitFrame.mockClear();
		const selection = passkeySelectorService.select(
			18,
			"https://example.com",
			"https://example.com",
			["First", "Second"],
			10000,
		);
		const show = emitFrame.mock.calls.find(
			(call) => call[2] === "show-passkey-selector",
		);
		const id = (show?.[3] as { id: string }).id;
		passkeySelectorService.onCancel(
			{ data: { id } },
			{
				tab: { id: 18, url: "https://example.com" },
				url: "https://example.com",
				frameId: 0,
			},
		);
		await expect(selection).rejects.toThrow("cancelled");
	});

	it("expires unanswered selections", async () => {
		jest.useFakeTimers();
		const emitFrame = jest
			.spyOn(browserClient, "emitFrame")
			.mockImplementation(() => {});
		const selection = passkeySelectorService.select(
			19,
			"https://example.com",
			"https://example.com",
			["First", "Second"],
			100,
		);
		jest.advanceTimersByTime(100);
		await expect(selection).rejects.toThrow("cancelled");
		expect(emitFrame).toHaveBeenCalledWith(
			19,
			0,
			"hide-passkey-selector",
			expect.anything(),
		);
		jest.useRealTimers();
	});
});
