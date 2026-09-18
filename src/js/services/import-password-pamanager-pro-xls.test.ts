import * as XLSX from "xlsx";
import importPasswordManagerProXls from "./import-password-pamanager-pro-xls";

describe("Service: importPasswordManagerProXls", () => {
	it.each([
		"biff8",
		"xlsx",
	] as const)("preserves raw numeric credentials instead of displayed values in %s workbooks", async (bookType) => {
		const sheet = XLSX.utils.aoa_to_sheet([
			[
				"Resource Name",
				"User Account",
				"Password",
				"Description",
				"Resource URL",
				"Notes",
				"Department",
			],
			[
				"Website credentials",
				987654321987,
				123456789123,
				"",
				"https://example.com",
				"",
				"Accounts",
			],
			[
				"Application credentials",
				123456789123,
				987654321987,
				"",
				"",
				"",
				"Accounts",
			],
		]);
		sheet.B2 = { t: "n", v: 987654321987, z: "General" };
		sheet.C2 = { t: "n", v: 123456789123, z: "General" };
		sheet.B3 = { t: "n", v: 123456789123, z: '"user-"000000000000' };
		sheet.C3 = { t: "n", v: 987654321987, z: '0000"-"0000"-"0000' };
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, sheet, "Passwords");
		const binary: ArrayBuffer = XLSX.write(workbook, {
			type: "array",
			bookType,
		});

		// Verify that the serialized fixture really has lossy/decorated display
		// values, so a switch to formatted SheetJS cells cannot pass unnoticed.
		const reloaded = XLSX.read(binary, { type: "array" });
		const displayed = XLSX.utils.sheet_to_json<string[]>(
			reloaded.Sheets.Passwords,
			{ header: 1, raw: false },
		);
		expect(displayed[1][2]).toBe("1.23457E+11");
		expect(displayed[2][1]).toBe("user-123456789123");
		expect(displayed[2][2]).toBe("9876-5432-1987");

		const output = await importPasswordManagerProXls.parser("", binary);
		if (!output) throw new Error("Expected a successful XLS import");
		expect(output.secrets).toMatchObject([
			{
				type: "website_password",
				name: "Website credentials",
				description: 987654321987,
				website_password_username: 987654321987,
				website_password_password: 123456789123,
			},
			{
				type: "application_password",
				name: "Application credentials",
				description: 123456789123,
				application_password_username: 123456789123,
				application_password_password: 987654321987,
			},
		]);
		expect(output.datastore.folders[0].name).toBe("Accounts");
		expect(output.datastore.folders[0].items[0]).toBe(output.secrets[0]);
		expect(output.datastore.folders[0].items[1]).toBe(output.secrets[1]);
	});
});
