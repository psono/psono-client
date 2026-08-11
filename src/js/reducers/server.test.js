import { LOGOUT, SET_SERVER_INFO } from "../actions/action-types";
import server from "./server";

describe("Reducer: server gateway capability", () => {
	it("defaults gateway support to false and only accepts an explicit signed true", () => {
		expect(server(undefined, { type: "unknown" }).gateway).toBe(false);
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: { gateway: true },
			}).gateway,
		).toBe(true);
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: { gateway: "true" },
			}).gateway,
		).toBe(false);
	});

	it("clears gateway support on logout", () => {
		const capable = server(undefined, {
			type: SET_SERVER_INFO,
			info: { gateway: true },
		});
		expect(server(capable, { type: LOGOUT, rememberMe: true }).gateway).toBe(
			false,
		);
	});
});
