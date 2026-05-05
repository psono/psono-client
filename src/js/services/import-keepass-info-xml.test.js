import React from "react";
import cryptoLibrary from "../services/crypto-library";
import importKeePassXml from "./import-keepass-info-xml";

describe("Service: importKeePassXml test suite", () => {
	const generic_uuid = "1fce01f4-6411-47a9-885c-a80bf4c654aa";

	beforeEach(() => {
		cryptoLibrary.generateUuid = jest.fn();
		cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);
	});

	it("importKeePassXml exists", () => {
		expect(importKeePassXml).toBeDefined();
	});

	it("returns null for invalid KeePass XML", () => {
		expect(importKeePassXml.parser("<Invalid />")).toBeNull();
		expect(importKeePassXml.parser("<KeePassFile />")).toBeNull();
		expect(
			importKeePassXml.parser("<KeePassFile><Root /></KeePassFile>"),
		).toBeNull();
	});

	it("parses entries, fields, tags, and nested groups", () => {
		const input = `
			<KeePassFile>
				<Root>
					<Group>
						<Name>Root</Name>
						<Entry>
							<Tags>work,admin</Tags>
							<String>
								<Value>ignored missing key</Value>
							</String>
							<String>
								<Key>IgnoredMissingValue</Key>
							</String>
							<String>
								<Key>Title</Key>
								<Value>Title &lt;One&gt; &amp; Two</Value>
							</String>
							<String>
								<Key>UserName</Key>
								<Value>alice</Value>
							</String>
							<String>
								<Key>Password</Key>
								<Value>secret</Value>
							</String>
							<String>
								<Key>URL</Key>
								<Value>https://example.com/login</Value>
							</String>
							<String>
								<Key>Notes</Key>
								<Value>hello &gt; goodbye</Value>
							</String>
							<String>
								<Key>Custom One</Key>
								<Value>value one</Value>
							</String>
							<String>
								<Key>Custom Two</Key>
								<Value>value two</Value>
							</String>
						</Entry>
						<Entry />
						<Group>
							<Name>Child</Name>
							<Entry>
								<String>
									<Key>Title</Key>
									<Value>Child Entry</Value>
								</String>
								<String>
									<Key>URL</Key>
									<Value></Value>
								</String>
							</Entry>
							<Group>
								<Name>Grandchild</Name>
							</Group>
						</Group>
						<Group>
							<Entry>
								<String>
									<Key>Title</Key>
									<Value>Skipped Folder Entry</Value>
								</String>
							</Entry>
						</Group>
					</Group>
				</Root>
			</KeePassFile>
		`;

		const output = importKeePassXml.parser(input);

		expect(output.datastore).toEqual({
			id: generic_uuid,
			name: output.datastore.name,
			items: [
				{
					id: generic_uuid,
					type: "website_password",
					name: "Title <One> & Two",
					urlfilter: "example.com",
					website_password_url_filter: "example.com",
					website_password_password: "secret",
					website_password_username: "alice",
					website_password_notes: "hello > goodbye",
					website_password_url: "https://example.com/login",
					website_password_title: "Title <One> & Two",
					tags: ["work", "admin"],
					description: "alice",
					custom_fields: [
						{
							name: "Custom One",
							type: "password",
							value: "value one",
						},
						{
							name: "Custom Two",
							type: "password",
							value: "value two",
						},
					],
				},
			],
			folders: [
				{
					id: generic_uuid,
					name: "Child",
					folders: [
						{
							id: generic_uuid,
							name: "Grandchild",
							folders: [],
							items: [],
						},
					],
					items: [
						{
							id: generic_uuid,
							type: "website_password",
							name: "Child Entry",
							urlfilter: "",
							website_password_url_filter: "",
							website_password_password: "",
							website_password_username: "",
							website_password_notes: "",
							website_password_url: "",
							website_password_title: "Child Entry",
						},
					],
				},
			],
		});
		expect(output.secrets).toEqual([
			output.datastore.items[0],
			output.datastore.folders[0].items[0],
		]);
	});

	it("keeps numeric names as strings", () => {
		const input = `
			<KeePassFile>
				<Root>
					<Group>
						<Name>Root</Name>
						<Group>
							<Name>2024</Name>
							<Entry>
								<String>
									<Key>Title</Key>
									<Value>12345</Value>
								</String>
								<String>
									<Key>UserName</Key>
									<Value>67890</Value>
								</String>
							</Entry>
						</Group>
					</Group>
				</Root>
			</KeePassFile>
		`;

		const output = importKeePassXml.parser(input);

		expect(output.datastore.folders[0].name).toBe("2024");
		expect(output.datastore.folders[0].items[0].name).toBe("12345");
	});
});
