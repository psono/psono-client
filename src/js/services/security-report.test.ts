import securityReportService from "./security-report";

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
