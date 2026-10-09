import { passwordEntropy } from "./password-entropy";

describe("Regular password generator entropy", () => {
	it("counts the selected alphabet and actual generated length", () => {
		expect(passwordEntropy(16, "abcdefghijklmnopqrstuvwxyz")).toBeCloseTo(
			16 * Math.log2(26),
			10,
		);
		expect(passwordEntropy(8, "0123456789")).toBeCloseTo(8 * Math.log2(10), 10);
		expect(passwordEntropy(16, "a")).toBe(0);
	});

	it("accounts for mandatory character classes", () => {
		// Four single-character classes at length four admit only 4! permutations.
		expect(passwordEntropy(4, "Aa1!")).toBeCloseTo(Math.log2(24), 10);
		expect(passwordEntropy(2, "Aa")).toBeCloseTo(1, 10);
		expect(passwordEntropy(8, "Aa1!")).toBeCloseTo(
			Math.log2(4 ** 8 - 4 * 3 ** 8 + 6 * 2 ** 8 - 4),
			10,
		);
	});

	it("does not credit duplicate characters as additional choices", () => {
		expect(passwordEntropy(4, "AAaa11!!")).toBeCloseTo(
			passwordEntropy(4, "Aa1!"),
			10,
		);
		const entropyPerCharacter =
			-2 * 0.4 * Math.log2(0.4) - 0.2 * Math.log2(0.2);
		expect(passwordEntropy(16, "aabbc")).toBeCloseTo(
			16 * entropyPerCharacter,
			10,
		);
	});

	it("matches exhaustive weighted enumeration with duplicate characters and class rejection", () => {
		const pool = "aaAb1!";
		const counts = new Map<string, number>();
		function enumerate(value: string) {
			if (value.length === 5) {
				if (
					/[ab]/.test(value) &&
					value.includes("A") &&
					value.includes("1") &&
					value.includes("!")
				) {
					counts.set(value, (counts.get(value) || 0) + 1);
				}
				return;
			}
			for (const character of pool) enumerate(value + character);
		}
		enumerate("");
		const total = Array.from(counts.values()).reduce(
			(sum, count) => sum + count,
			0,
		);
		const expected = Array.from(counts.values()).reduce((sum, count) => {
			const probability = count / total;
			return sum - probability * Math.log2(probability);
		}, 0);
		expect(passwordEntropy(5, pool)).toBeCloseTo(expected, 10);
	});

	it("remains stable when required character classes are extremely unlikely", () => {
		expect(passwordEntropy(4, "a".repeat(10000) + "A1!")).toBeCloseTo(
			Math.log2(24),
			10,
		);
	});

	it("matches the generator's UTF-16 sampling and ASCII class rules for custom alphabets", () => {
		expect(passwordEntropy(2, "aé")).toBeCloseTo(Math.log2(3), 10);
		expect(passwordEntropy(2, "a🙂")).toBeCloseTo(Math.log2(5), 10);
		expect(passwordEntropy(16, "éè")).toBe(0);
	});

	it.each([
		0,
		-1,
		2.5,
		NaN,
		Infinity,
	])("returns zero for invalid or empty generated length %s", (length) => {
		expect(passwordEntropy(length, "Aa1!")).toBe(0);
	});
	it("returns zero when no password can be generated", () => {
		expect(passwordEntropy(16, "")).toBe(0);
		expect(passwordEntropy(3, "Aa1!")).toBe(0);
	});
});
