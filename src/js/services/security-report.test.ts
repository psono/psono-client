import securityReportService from "./security-report";
import rootReducer from "../reducers";
import datastoreService from "./datastore";
import datastoreUserService from "./datastore-user";
import exportService from "./export";
import * as storeService from "./store";

describe("Service: securityReportService - request failures", () => {
	const completed = jest.fn();
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

	beforeAll(() => {
		securityReportService.on("generation-complete", completed);
	});

	beforeEach(() => {
		completed.mockClear();
		const state = rootReducer(undefined, { type: "@@INIT" });
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
		} as ReturnType<typeof storeService.getStore>);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("returns a displayable error when the overview is unavailable and allows retrying", async () => {
		jest
			.spyOn(datastoreService, "getDatastoreOverview")
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(overview);
		const fetch = jest
			.spyOn(exportService, "fetchDatastore")
			.mockResolvedValue({});
		jest
			.spyOn(datastoreUserService, "searchUser")
			.mockResolvedValue({ data: [] });

		await expect(
			securityReportService.generateSecurityReport("", false),
		).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
		expect(fetch).not.toHaveBeenCalled();
		expect(completed).not.toHaveBeenCalled();

		await expect(
			securityReportService.generateSecurityReport("", false),
		).resolves.toMatchObject({
			msgs: ["ANALYSIS_SUCCESSFUL"],
			analysis: { passwords: [], password_summary: { total: 0 } },
		});
		expect(fetch).toHaveBeenCalledWith(
			undefined,
			"password-store",
			false,
			true,
		);
		expect(completed).toHaveBeenCalledTimes(1);
	});

	it("preserves rejected overview errors instead of analyzing missing data", async () => {
		const error = { errors: ["RESOURCE_NOT_FOUND"] };
		jest
			.spyOn(datastoreService, "getDatastoreOverview")
			.mockRejectedValue(error);

		await expect(
			securityReportService.generateSecurityReport("", false),
		).rejects.toBe(error);
		expect(completed).not.toHaveBeenCalled();
	});

	it("does not report successful generation after the user summary request fails", async () => {
		const error = { errors: ["SERVER_OFFLINE"] };
		jest
			.spyOn(datastoreService, "getDatastoreOverview")
			.mockResolvedValue(overview);
		jest.spyOn(exportService, "fetchDatastore").mockResolvedValue({});
		jest.spyOn(datastoreUserService, "searchUser").mockRejectedValue(error);

		await expect(
			securityReportService.generateSecurityReport("", false),
		).rejects.toBe(error);
		expect(completed).not.toHaveBeenCalled();
	});
});

describe("Service: securityReportService - connection entries", () => {
	it("includes only embedded connection passwords", () => {
		const passwords = securityReportService.filterPasswords([
			{
				items: [
					{
						type: "ssh_connection",
						name: "SSH with password",
						secret_id: "ssh-password-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
						ssh_connection_authentication_type: "password",
						ssh_connection_username: "ssh-user",
						ssh_connection_password: "embedded-ssh-password",
					},
					{
						type: "ssh_connection",
						name: "SSH with key",
						secret_id: "ssh-key-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
						ssh_connection_authentication_type: "private_key",
						ssh_connection_password: "must-not-be-counted",
					},
					{
						type: "ssh_connection",
						name: "SSH with referenced password",
						secret_id: "ssh-reference-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
						ssh_connection_authentication_type: "password",
					},
					{
						type: "rdp_connection",
						name: "RDP",
						secret_id: "rdp-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
						rdp_connection_username: "rdp-user",
						rdp_connection_password: "embedded-rdp-password",
					},
					{
						type: "rdp_connection",
						name: "RDP with referenced password",
						secret_id: "rdp-reference-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
					},
					{
						type: "vnc_connection",
						name: "VNC",
						secret_id: "vnc-id",
						create_date: "2026-01-01T00:00:00Z",
						write_date: "2026-01-02T00:00:00Z",
						vnc_connection_username: "",
						vnc_connection_password: "embedded-vnc-password",
					},
				],
			},
		]);

		expect(passwords).toEqual([
			{
				type: "ssh_connection",
				name: "SSH with password",
				secret_id: "ssh-password-id",
				username: "ssh-user",
				password: "embedded-ssh-password",
				create_date: "2026-01-01T00:00:00Z",
				write_date: "2026-01-02T00:00:00Z",
				master_password: false,
			},
			{
				type: "rdp_connection",
				name: "RDP",
				secret_id: "rdp-id",
				username: "rdp-user",
				password: "embedded-rdp-password",
				create_date: "2026-01-01T00:00:00Z",
				write_date: "2026-01-02T00:00:00Z",
				master_password: false,
			},
			{
				type: "vnc_connection",
				name: "VNC",
				secret_id: "vnc-id",
				username: "",
				password: "embedded-vnc-password",
				create_date: "2026-01-01T00:00:00Z",
				write_date: "2026-01-02T00:00:00Z",
				master_password: false,
			},
		]);
	});
});
