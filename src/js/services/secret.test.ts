import secretService from "./secret";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import rootReducer from "../reducers";
import * as storeService from "./store";
import type { SecretContent } from "../../types/vault";

describe("password modification timestamps in encrypted secrets", () => {
	const now = "2026-10-13T12:00:00.000Z";
	const old = "2025-01-01T09:00:00.123456Z";
	let previous: SecretContent;
	let written: SecretContent;

	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(new Date(now));
		const state = rootReducer(undefined, { type: "@@INIT" });
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
		} as ReturnType<typeof storeService.getStore>);
		previous = {
			website_password_password: "original",
			password_modification_datetime: old,
		};
		jest.spyOn(cryptoLibrary, "generateSecretKey").mockReturnValue("key");
		jest.spyOn(cryptoLibrary, "encryptData").mockImplementation((json) => {
			written = JSON.parse(json);
			return { text: "encrypted", nonce: "nonce" };
		});
		jest
			.spyOn(cryptoLibrary, "decryptData")
			.mockImplementation(() => JSON.stringify(previous));
		jest.spyOn(apiClient, "readSecret").mockResolvedValue({
			data: {
				id: "secret",
				data: "encrypted",
				data_nonce: "nonce",
				write_date: "2026-10-12T00:00:00Z",
			},
		});
		jest
			.spyOn(apiClient, "writeSecret")
			.mockResolvedValue({ data: { secret_id: "secret" } });
		jest
			.spyOn(apiClient, "createSecret")
			.mockResolvedValue({ data: { secret_id: "secret" } });
		jest.spyOn(apiClient, "createSecretBulk").mockResolvedValue({
			data: { secrets: [{ secret_id: "secret", link_id: "link" }] },
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it("initializes new passwords in individual and bulk creation", async () => {
		await secretService.createSecret(
			{ website_password_password: "new" },
			"link",
		);
		expect(written.password_modification_datetime).toBe(now);
		await secretService.createSecretBulk([
			{ linkId: "link", content: { application_password_password: "new" } },
		]);
		expect(written.password_modification_datetime).toBe(now);
	});

	it("preserves timestamps when cloning or importing an existing password", async () => {
		await secretService.createSecret(previous, "link");
		expect(written.password_modification_datetime).toBe(old);
	});

	it.each([
		"website_password_password",
		"application_password_password",
		"elster_certificate_password",
		"ssh_connection_password",
		"rdp_connection_password",
		"vnc_connection_password",
	])("tracks changes to %s while preserving age on other edits", async (field) => {
		previous = { [field]: "original", password_modification_datetime: old };
		await secretService.writeSecret("secret", "key", {
			[field]: "original",
			note_notes: "changed",
		});
		expect(written.password_modification_datetime).toBe(old);
		await secretService.writeSecret("secret", "key", {
			[field]: "changed",
			password_modification_datetime: old,
		});
		expect(written.password_modification_datetime).toBe(now);
	});

	it("anchors legacy passwords to their previous write_date on a notes-only edit", async () => {
		delete previous.password_modification_datetime;
		await secretService.writeSecret("secret", "key", {
			website_password_password: "original",
		});
		expect(written.password_modification_datetime).toBe("2026-10-12T00:00:00Z");
	});

	it("records password removal and does not timestamp unrelated secrets", async () => {
		await secretService.writeSecret("secret", "key", {
			website_password_title: "without password",
		});
		expect(written.password_modification_datetime).toBe(now);
		await secretService.createSecret({ note_notes: "note" }, "link");
		expect(written).not.toHaveProperty("password_modification_datetime");
	});
});
