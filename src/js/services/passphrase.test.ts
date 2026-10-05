import cryptoLibrary from "./crypto-library";
import { languages } from "../i18n";
import {
	generatePassphrase,
	hasRequiredCharacters,
	loadWordlist,
	passphraseEntropy,
} from "./passphrase";
import {
	resolveWordlistLanguage,
	wordlistLanguages,
} from "./passphrase-config";

jest.mock("./store", () => ({ getStore: jest.fn() }));

afterEach(() => jest.restoreAllMocks());

describe("Passphrase dictionaries", () => {
	it("covers every frontend language whose native script has letter case", () => {
		for (const language of Object.values(languages)) {
			if (
				/\p{Lu}/u.test(language.lng_title_native) &&
				/\p{Ll}/u.test(language.lng_title_native)
			) {
				const base = language.code.split("-")[0];
				expect(resolveWordlistLanguage(language.code)).toBe(base);
				expect(wordlistLanguages).toHaveProperty(base);
			}
		}
	});
	it.each(
		Object.keys(wordlistLanguages),
	)("%s loads 2,000 unique lowercase words of at least four letters", async (language) => {
		const words = await loadWordlist(language);
		expect(words).toHaveLength(2000);
		expect(new Set(words).size).toBe(2000);
		for (const word of words) {
			expect(Array.from(word).length).toBeGreaterThanOrEqual(4);
			expect(word).toMatch(/^\p{Ll}+$/u);
			expect(word).toBe(word.normalize("NFC"));
			expect(Array.from(word[0].toUpperCase())).toHaveLength(1);
			expect(Array.from(word[word.length - 1].toUpperCase())).toHaveLength(1);
			expect(word).toMatch(
				language === "ru" || language === "uk"
					? /^\p{Script=Cyrillic}+$/u
					: /^\p{Script=Latin}+$/u,
			);
		}
	});
	it("loads the English dictionary for unsupported locales and reuses loaded dictionaries", async () => {
		const words = await loadWordlist("en");
		expect(await loadWordlist("ja")).toBe(words);
		expect(await loadWordlist("en-US")).toBe(words);
	});
	it.each([
		["fr-CA", "fr"],
		["FR_fr", "fr"],
		["de-CH", "de"],
		["es-MX", "es"],
		["da-DK", "da"],
		["pt-BR", "pt"],
		["pt_PT", "pt"],
		["nb-NO", "no"],
		["no-NO", "no"],
		["ru-RU", "ru"],
		["uk-UA", "uk"],
		["cs-CZ", "cs"],
		["ja", "en"],
		["ar", "en"],
		["bn", "en"],
		["hi", "en"],
		["he", "en"],
		["ko", "en"],
		["zh-Hans", "en"],
		["zh-Hant", "en"],
		[undefined, "en"],
	])("resolves locale %s to %s", (locale, language) => {
		expect(resolveWordlistLanguage(locale)).toBe(language);
	});
});

describe("Secure passphrase generation", () => {
	it.each(
		Object.keys(wordlistLanguages),
	)("generates compliant passphrases from the %s list", async (language) => {
		const words = new Set(await loadWordlist(language));
		for (const count of [2, 4, 8]) {
			for (let i = 0; i < 20; i++) {
				const value = await generatePassphrase(count, language);
				expect(hasRequiredCharacters(value)).toBe(true);
				const parts = value.split("-");
				expect(parts).toHaveLength(count);
				for (const part of parts) {
					const match = part.match(/^(10|[1-9])?(\p{L}+)(10|[1-9])?$/u)!;
					expect(match).not.toBeNull();
					expect(words.has(match[2].toLowerCase())).toBe(true);
					expect(match[2].slice(1, -1)).toMatch(/^\p{Ll}+$/u);
				}
			}
		}
	});

	function mockDraws(values: number[]) {
		return jest.spyOn(cryptoLibrary, "randomBytes").mockImplementation(() => {
			const value = values.shift();
			if (value === undefined) throw new Error("Unexpected random draw");
			const bytes = new Uint8Array(4);
			new DataView(bytes.buffer).setUint32(0, value);
			return bytes;
		});
	}

	it("rejects biased random samples and supports none, 1 and 10 at either endpoint", async () => {
		// First draw is outside the evenly divisible 2,000-word range.
		const rng = mockDraws([0xffffffff, 0, 1, 0, 10, 0, 1, 0, 1, 0, 1]);
		const [first, second] = await loadWordlist("en");
		expect(await generatePassphrase(2)).toBe(
			`10${first[0].toUpperCase()}${first.slice(1)}-${second.slice(0, -1)}${second.slice(-1).toUpperCase()}1`,
		);
		expect(rng).toHaveBeenCalledTimes(11);
	});

	it("regenerates draws without a capital or a number rather than forcing a predictable character", async () => {
		const noCapital = [0, 0, 0, 1, 1, 0, 0, 0, 1, 1];
		const noNumber = [0, 1, 1, 0, 0, 0, 1, 1, 0, 0];
		const accepted = [0, 1, 0, 1, 0, 0, 0, 1, 0, 1];
		const rng = mockDraws([...noCapital, ...noNumber, ...accepted]);
		expect(hasRequiredCharacters(await generatePassphrase(2))).toBe(true);
		expect(rng).toHaveBeenCalledTimes(30);
	});

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
	])("rejects invalid word count %s", async (value) => {
		await expect(generatePassphrase(value)).rejects.toThrow(RangeError);
	});
	it("defaults to four words and accepts numeric form inputs", async () => {
		expect((await generatePassphrase()).split("-")).toHaveLength(4);
		expect((await generatePassphrase("2")).split("-")).toHaveLength(2);
	});
});

describe("Known-generator entropy", () => {
	it("counts only the public word and mutation choices, with rejection correction", async () => {
		// For two words: 2,000² choices, 15 allowed casing patterns, 121² - 1
		// allowed number patterns. Lowercase interiors and dashes are fixed.
		expect(await passphraseEntropy(2)).toBeCloseTo(
			Math.log2(2000 ** 2 * 15 * (121 ** 2 - 1)),
			10,
		);
		expect(await passphraseEntropy(4)).toBeCloseTo(79.533, 2);
		expect(await passphraseEntropy(8)).toBeGreaterThan(
			await passphraseEntropy(4),
		);
		expect(await passphraseEntropy(1)).toBe(0);
	});
});
