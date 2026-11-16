import { SET_SERVER_INFO } from "../actions/action-types";
import rootReducer from "../reducers";
import apiPwnedpasswordsService from "./api-pwnedpasswords";
import * as storeService from "./store";

describe("Service: configurable Pwned Passwords API", () => {
	const originalFetch = global.fetch;
	let state: ReturnType<typeof rootReducer>;
	let fetchMock: jest.Mock;

	beforeEach(() => {
		state = rootReducer(undefined, { type: "@@INIT" });
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
		} as ReturnType<typeof storeService.getStore>);
		fetchMock = jest.fn().mockResolvedValue({ text: async () => "SUFFIX:42" });
		global.fetch = fetchMock;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it.each([
		undefined,
		"",
		"  ",
		"https://api.pwnedpasswords.com/",
	])("uses Have I Been Pwned and its explanation for %s", async (url) => {
		state = rootReducer(state, {
			type: SET_SERVER_INFO,
			info: { pwned_passwords_api_url: url },
		});

		await expect(apiPwnedpasswordsService.range("ABCDE")).resolves.toEqual({
			data: "SUFFIX:42",
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.pwnedpasswords.com/range/ABCDE",
			{ method: "GET", headers: {} },
		);
		expect(apiPwnedpasswordsService.usesCustomApiUrl()).toBe(false);
	});

	it("uses the custom base path and generic explanation, then resets for an older server", async () => {
		state = rootReducer(state, {
			type: SET_SERVER_INFO,
			info: { pwned_passwords_api_url: " https://breaches.example.com/api/ " },
		});

		await apiPwnedpasswordsService.range("ABCDE");
		expect(fetchMock).toHaveBeenLastCalledWith(
			"https://breaches.example.com/api/range/ABCDE",
			{ method: "GET", headers: {} },
		);
		expect(apiPwnedpasswordsService.usesCustomApiUrl()).toBe(true);

		state = rootReducer(state, { type: SET_SERVER_INFO, info: {} });
		await apiPwnedpasswordsService.range("12345");
		expect(fetchMock).toHaveBeenLastCalledWith(
			"https://api.pwnedpasswords.com/range/12345",
			{ method: "GET", headers: {} },
		);
		expect(apiPwnedpasswordsService.usesCustomApiUrl()).toBe(false);
	});
});
