import React from "react";
import cryptoLibrary from "../services/crypto-library";
import importPsonoJson from "./import-psono-json";
import { initStore } from "./store";

describe("Service: importPsonoJson test suite", () => {
	it("importPsonoJson exists", () => {
		expect(importPsonoJson).toBeDefined();
	});

	it("parse", async () => {
		await initStore();
		const generic_uuid = "1fce01f4-6411-47a9-885c-a80bf4c654aa";
		cryptoLibrary.generateUuid = jest.fn();
		cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

		const input =
			'{"folders":[{"name":"A Folder"},{"name":"Company Passwords","folders":[{"name":"bla","items":[{"type":"website_password","urlfilter":"facebook.com","name":"Facebook","website_password_url_filter":"facebook.com","website_password_auto_submit":true,"website_password_password":"mypassword","website_password_username":"myusername","website_password_url":"https://de-de.facebook.com/","website_password_title":"Facebook"}, {"type":"website_password","name":"Instagram","website_password_auto_submit":true,"website_password_password":"mypassword","website_password_username":"myusername","website_password_url":"https://de-de.instagram.com/","website_password_title":"Instagram"}]}]}],"items":[{"type":"website_password","urlfilter":"amazon.de","name":"Amazon.de","website_password_url_filter":"amazon.de","website_password_password":"mypw","website_password_username":"myuser","website_password_url":"https://www.amazon.de","website_password_title":"Amazon.de"},{"type":"note","name":"My secret note","note_notes":"Some nice secrets go in here!","note_title":"My secret note"}]}';

		const output = importPsonoJson.parser(input);

		const expected_output = {
			datastore: {
				folders: [
					{
						name: "A Folder",
						id: generic_uuid,
					},
					{
						name: "Company Passwords",
						folders: [
							{
								name: "bla",
								items: [
									{
										type: "website_password",
										urlfilter: "facebook.com",
										name: "Facebook",
										website_password_url_filter: "facebook.com",
										website_password_auto_submit: true,
										website_password_password: "mypassword",
										website_password_username: "myusername",
										website_password_url: "https://de-de.facebook.com/",
										website_password_title: "Facebook",
										id: generic_uuid,
									},
									{
										type: "website_password",
										urlfilter: "de-de.instagram.com",
										name: "Instagram",
										website_password_url_filter: "de-de.instagram.com",
										website_password_auto_submit: true,
										website_password_password: "mypassword",
										website_password_username: "myusername",
										website_password_url: "https://de-de.instagram.com/",
										website_password_title: "Instagram",
										id: generic_uuid,
									},
								],
								id: generic_uuid,
							},
						],
						id: generic_uuid,
					},
				],
				items: [
					{
						type: "website_password",
						urlfilter: "amazon.de",
						name: "Amazon.de",
						website_password_url_filter: "amazon.de",
						website_password_password: "mypw",
						website_password_username: "myuser",
						website_password_url: "https://www.amazon.de",
						website_password_title: "Amazon.de",
						id: generic_uuid,
					},
					{
						type: "note",
						name: "My secret note",
						note_notes: "Some nice secrets go in here!",
						note_title: "My secret note",
						id: generic_uuid,
					},
				],
				name: output.datastore.name,
				id: generic_uuid,
			},
			secrets: [
				{
					type: "website_password",
					urlfilter: "facebook.com",
					name: "Facebook",
					website_password_url_filter: "facebook.com",
					website_password_auto_submit: true,
					website_password_password: "mypassword",
					website_password_username: "myusername",
					website_password_url: "https://de-de.facebook.com/",
					website_password_title: "Facebook",
					id: generic_uuid,
				},
				{
					type: "website_password",
					urlfilter: "de-de.instagram.com",
					name: "Instagram",
					website_password_url_filter: "de-de.instagram.com",
					website_password_auto_submit: true,
					website_password_password: "mypassword",
					website_password_username: "myusername",
					website_password_url: "https://de-de.instagram.com/",
					website_password_title: "Instagram",
					id: generic_uuid,
				},
				{
					type: "website_password",
					urlfilter: "amazon.de",
					name: "Amazon.de",
					website_password_url_filter: "amazon.de",
					website_password_password: "mypw",
					website_password_username: "myuser",
					website_password_url: "https://www.amazon.de",
					website_password_title: "Amazon.de",
					id: generic_uuid,
				},
				{
					type: "note",
					name: "My secret note",
					note_notes: "Some nice secrets go in here!",
					note_title: "My secret note",
					id: generic_uuid,
				},
			],
		};

		expect(output).toEqual(expected_output);
	});

	it("imports SSH, RDP, and VNC connection fields", async () => {
		await initStore();
		cryptoLibrary.generateUuid = jest.fn(
			() => "1fce01f4-6411-47a9-885c-a80bf4c654aa",
		);
		const output = importPsonoJson.parser(
			JSON.stringify({
				items: [
					{
						type: "ssh_connection",
						name: "SSH",
						ssh_connection_title: "SSH",
						ssh_connection_host: "ssh.example.com",
						ssh_connection_port: 22,
					},
					{
						type: "rdp_connection",
						name: "RDP",
						rdp_connection_title: "RDP",
						rdp_connection_host: "rdp.example.com",
						rdp_connection_port: 3389,
						rdp_connection_ignore_certificate: true,
					},
					{
						type: "vnc_connection",
						name: "VNC",
						vnc_connection_title: "VNC",
						vnc_connection_host: "vnc.example.com",
						vnc_connection_port: 5900,
					},
				],
			}),
		);

		expect(output.secrets.map((secret) => secret.type)).toEqual([
			"ssh_connection",
			"rdp_connection",
			"vnc_connection",
		]);
		expect(output.secrets[1].rdp_connection_ignore_certificate).toBe(true);
	});
});
