import cryptoLibrary from "./crypto-library";
import { languages } from "../i18n";
import {
	generatePassphrase,
	hasRequiredCharacters,
	passphraseEntropy,
	resolveWordlistLanguage,
	wordlists,
	wordlistLanguages,
} from "./passphrase";

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
				expect(wordlists).toHaveProperty(base);
			}
		}
	});
	it("offers a language choice for every bundled dictionary", () => {
		expect(Object.keys(wordlistLanguages).sort()).toEqual(
			Object.keys(wordlists).sort(),
		);
	});
	it.each(
		Object.entries(wordlists),
	)("%s has 2,000 unique lowercase words of at least four letters", (language, words) => {
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
		Object.keys(wordlists),
	)("generates compliant passphrases from the %s list", (language) => {
		const words = new Set(wordlists[language]);
		for (const count of [2, 4, 8]) {
			for (let i = 0; i < 20; i++) {
				const value = generatePassphrase(count, language);
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

	it("rejects biased random samples and supports none, 1 and 10 at either endpoint", () => {
		// First draw is outside the evenly divisible 2,000-word range.
		const rng = mockDraws([0xffffffff, 0, 1, 0, 10, 0, 1, 0, 1, 0, 1]);
		const first = wordlists.en[0];
		const second = wordlists.en[1];
		expect(generatePassphrase(2)).toBe(
			`10${first[0].toUpperCase()}${first.slice(1)}-${second.slice(0, -1)}${second.slice(-1).toUpperCase()}1`,
		);
		expect(rng).toHaveBeenCalledTimes(11);
	});

	it("regenerates draws without a capital or a number rather than forcing a predictable character", () => {
		const noCapital = [0, 0, 0, 1, 1, 0, 0, 0, 1, 1];
		const noNumber = [0, 1, 1, 0, 0, 0, 1, 1, 0, 0];
		const accepted = [0, 1, 0, 1, 0, 0, 0, 1, 0, 1];
		const rng = mockDraws([...noCapital, ...noNumber, ...accepted]);
		expect(hasRequiredCharacters(generatePassphrase(2))).toBe(true);
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
	])("rejects invalid word count %s", (value) => {
		expect(() => generatePassphrase(value)).toThrow(RangeError);
	});
	it("defaults to four words and accepts numeric form inputs", () => {
		expect(generatePassphrase().split("-")).toHaveLength(4);
		expect(generatePassphrase("2").split("-")).toHaveLength(2);
	});
});

describe("Known-generator entropy", () => {
	it("counts only the public word and mutation choices, with rejection correction", () => {
		// For two words: 2,000² choices, 15 allowed casing patterns, 121² - 1
		// allowed number patterns. Lowercase interiors and dashes are fixed.
		expect(passphraseEntropy(2)).toBeCloseTo(
			Math.log2(2000 ** 2 * 15 * (121 ** 2 - 1)),
			10,
		);
		expect(passphraseEntropy(4)).toBeCloseTo(79.533, 2);
		expect(passphraseEntropy(8)).toBeGreaterThan(passphraseEntropy(4));
		expect(passphraseEntropy(1)).toBe(0);
	});
});
