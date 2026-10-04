import { isValidWordCount, normalizeWordCount } from "./passphrase-config";

describe("Passphrase word count configuration", () => {
	it.each([
		0,
		1,
		-3,
		2.5,
		NaN,
		Infinity,
		"",
		"garbage",
		129,
	])("rejects invalid count %s and falls back to four words", (value) => {
		expect(isValidWordCount(value)).toBe(false);
		expect(normalizeWordCount(value)).toBe(4);
	});
	it.each([2, "2", 4, "6", 128])("accepts valid count %s", (value) => {
		expect(isValidWordCount(value)).toBe(true);
		expect(normalizeWordCount(value)).toBe(Number(value));
	});
	it("defaults missing persisted settings to four words", () => {
		expect(normalizeWordCount(undefined)).toBe(4);
		expect(normalizeWordCount(null)).toBe(4);
	});
});
