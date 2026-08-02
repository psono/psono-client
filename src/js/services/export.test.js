import exportService from "./export";

describe("Service: exportService - connection entries", () => {
	it("exports embedded SSH and RDP fields to CSV", async () => {
		const csv = await exportService.composeExport(
			{
				items: [
					{
						type: "ssh_connection",
						ssh_connection_title: "Production SSH",
						ssh_connection_host: "ssh.example.com",
						ssh_connection_password: "ssh-password",
					},
					{
						type: "rdp_connection",
						rdp_connection_title: "Production RDP",
						rdp_connection_domain: "EXAMPLE",
						rdp_connection_password: "rdp-password",
					},
				],
			},
			"csv",
			undefined,
			[
				"type",
				"ssh_connection_title",
				"ssh_connection_host",
				"ssh_connection_password",
				"rdp_connection_title",
				"rdp_connection_domain",
				"rdp_connection_password",
			],
		);

		expect(csv).toContain("ssh_connection_title");
		expect(csv).toContain("Production SSH");
		expect(csv).toContain("ssh-password");
		expect(csv).toContain("Production RDP");
		expect(csv).toContain("rdp-password");
		expect(csv).not.toContain("ignored-reference");
	});

	it("exports connection secrets as protected KDBX values", () => {
		const kdbxweb = {
			ProtectedValue: {
				fromString: jest.fn((value) => ({ protected: value })),
			},
		};
		const db = {
			createEntry: jest.fn(() => ({ fields: new Map() })),
		};
		const sshEntry = exportService.addConnectionKdbxEntry(
			db,
			kdbxweb,
			{},
			{
				type: "ssh_connection",
				ssh_connection_title: "Production SSH",
				ssh_connection_host: "ssh.example.com",
				ssh_connection_port: "22",
				ssh_connection_authentication_type: "private_key",
				ssh_connection_username: "ssh-user",
				ssh_connection_password: "ssh-password",
				ssh_connection_private_key: "private-key",
				ssh_connection_notes: "SSH notes",
			},
		);
		const rdpEntry = exportService.addConnectionKdbxEntry(
			db,
			kdbxweb,
			{},
			{
				type: "rdp_connection",
				rdp_connection_title: "Production RDP",
				rdp_connection_host: "rdp.example.com",
				rdp_connection_port: "3389",
				rdp_connection_domain: "EXAMPLE",
				rdp_connection_username: "rdp-user",
				rdp_connection_password: "rdp-password",
				rdp_connection_notes: "RDP notes",
			},
		);

		expect(sshEntry.fields.get("Host")).toBe("ssh.example.com");
		expect(sshEntry.fields.get("Password")).toEqual({
			protected: "ssh-password",
		});
		expect(sshEntry.fields.get("Private Key")).toEqual({
			protected: "private-key",
		});
		expect(rdpEntry.fields.get("Domain")).toBe("EXAMPLE");
		expect(rdpEntry.fields.get("Password")).toEqual({
			protected: "rdp-password",
		});
		expect(sshEntry.fields.has("Application Password Reference")).toBe(false);
		expect(rdpEntry.fields.has("Credential Reference")).toBe(false);
	});
});
