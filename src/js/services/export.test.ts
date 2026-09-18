import exportService from "./export";
import { KdbxEntry, KdbxGroup, ProtectedValue } from "kdbxweb";

describe("Service: exportService - connection entries", () => {
	it("exports embedded SSH, RDP, and VNC fields to CSV", async () => {
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
						rdp_connection_ignore_certificate: true,
						rdp_connection_resize_method: "reconnect",
						rdp_connection_server_layout: "de-de-qwertz",
						rdp_connection_password: "rdp-password",
					},
					{
						type: "vnc_connection",
						vnc_connection_title: "Production VNC",
						vnc_connection_host: "vnc.example.com",
						vnc_connection_password: "vnc-password",
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
				"rdp_connection_ignore_certificate",
				"rdp_connection_resize_method",
				"rdp_connection_server_layout",
				"rdp_connection_password",
				"vnc_connection_title",
				"vnc_connection_host",
				"vnc_connection_password",
			],
		);

		expect(csv).toContain("ssh_connection_title");
		expect(csv).toContain("Production SSH");
		expect(csv).toContain("ssh-password");
		expect(csv).toContain("Production RDP");
		expect(csv).toContain("rdp_connection_ignore_certificate");
		expect(csv).toContain("reconnect");
		expect(csv).toContain("de-de-qwertz");
		expect(csv).toContain("rdp-password");
		expect(csv).toContain("Production VNC");
		expect(csv).toContain("vnc-password");
		expect(csv).not.toContain("ignored-reference");
	});

	it("exports connection secrets as protected KDBX values", () => {
		const kdbxweb = { ProtectedValue };
		const db = {
			createEntry: jest.fn(() => new KdbxEntry()),
		};
		const sshEntry = exportService.addConnectionKdbxEntry(
			db,
			kdbxweb,
			new KdbxGroup(),
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
			new KdbxGroup(),
			{
				type: "rdp_connection",
				rdp_connection_title: "Production RDP",
				rdp_connection_host: "rdp.example.com",
				rdp_connection_port: "3389",
				rdp_connection_domain: "EXAMPLE",
				rdp_connection_ignore_certificate: true,
				rdp_connection_resize_method: "reconnect",
				rdp_connection_server_layout: "de-de-qwertz",
				rdp_connection_username: "rdp-user",
				rdp_connection_password: "rdp-password",
				rdp_connection_notes: "RDP notes",
			},
		);
		const vncEntry = exportService.addConnectionKdbxEntry(
			db,
			kdbxweb,
			new KdbxGroup(),
			{
				type: "vnc_connection",
				vnc_connection_title: "Production VNC",
				vnc_connection_host: "vnc.example.com",
				vnc_connection_port: "5900",
				vnc_connection_username: "vnc-user",
				vnc_connection_password: "vnc-password",
				vnc_connection_notes: "VNC notes",
			},
		);

		expect(sshEntry.fields.get("Host")).toBe("ssh.example.com");
		const sshPassword = sshEntry.fields.get("Password");
		const sshPrivateKey = sshEntry.fields.get("Private Key");
		if (
			!(sshPassword instanceof ProtectedValue) ||
			!(sshPrivateKey instanceof ProtectedValue)
		) {
			throw new Error("SSH credentials must be protected KDBX values");
		}
		expect(sshPassword.getText()).toBe("ssh-password");
		expect(sshPrivateKey.getText()).toBe("private-key");
		expect(rdpEntry.fields.get("Domain")).toBe("EXAMPLE");
		expect(rdpEntry.fields.get("Ignore Certificate Validation")).toBe("true");
		expect(rdpEntry.fields.get("Resize Method")).toBe("reconnect");
		expect(rdpEntry.fields.get("Remote Keyboard Layout")).toBe("de-de-qwertz");
		const rdpPassword = rdpEntry.fields.get("Password");
		if (!(rdpPassword instanceof ProtectedValue)) {
			throw new Error("RDP password must be protected");
		}
		expect(rdpPassword.getText()).toBe("rdp-password");
		expect(vncEntry.fields.get("Host")).toBe("vnc.example.com");
		const vncPassword = vncEntry.fields.get("Password");
		if (!(vncPassword instanceof ProtectedValue)) {
			throw new Error("VNC password must be protected");
		}
		expect(vncPassword.getText()).toBe("vnc-password");
		expect(sshEntry.fields.has("Application Password Reference")).toBe(false);
		expect(rdpEntry.fields.has("Credential Reference")).toBe(false);
	});
});
