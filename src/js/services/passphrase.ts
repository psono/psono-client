import cryptoLibrary from "./crypto-library";
import {
	DEFAULT_WORD_COUNT,
	isValidWordCount,
	resolveWordlistLanguage,
} from "./passphrase-config";

/** Webpack emits one local chunk per language and caches loaded dictionaries. */
export async function loadWordlist(
	language = "en",
): Promise<readonly string[]> {
	const { default: words } = await import(
		/* webpackChunkName: "passphrase-wordlist-[request]" */
		`../../common/data/wordlists/${resolveWordlistLanguage(language)}.json`
	);
	return words;
}

/** Rejection sampling avoids modulo bias, including for the 2,000-word lists. */
function randomIndex(size: number): number {
	const range = 0x100000000;
	const limit = range - (range % size);
	let value: number;
	do {
		const bytes = cryptoLibrary.randomBytes(4);
		value = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
	} while (value >= limit);
	return value % size;
}

export function hasRequiredCharacters(value: string): boolean {
	return /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value) && /[0-9]/.test(value);
}

export async function generatePassphrase(
	count: number | string = DEFAULT_WORD_COUNT,
	language = "en",
): Promise<string> {
	if (!isValidWordCount(count)) {
		throw new RangeError("Invalid passphrase word count");
	}
	const words = await loadWordlist(language);
	let passphrase: string;
	do {
		const parts: string[] = [];
		for (let i = 0; i < Number(count); i++) {
			const word = Array.from(words[randomIndex(words.length)]);
			// Independently uppercase the first and last letter with probability 1/2.
			if (randomIndex(2)) word[0] = word[0].toUpperCase();
			if (randomIndex(2)) {
				word[word.length - 1] = word[word.length - 1].toUpperCase();
			}
			// Each endpoint independently chooses none or 1..10, uniformly.
			const prefix = randomIndex(11);
			const suffix = randomIndex(11);
			parts.push(`${prefix || ""}${word.join("")}${suffix || ""}`);
		}
		passphrase = parts.join("-");
	} while (!hasRequiredCharacters(passphrase));
	return passphrase;
}

/**
 * Exact entropy of the uniform accepted output space, assuming the attacker
 * knows the list, count and rules. Interiors always provide lowercase letters.
 * Rejecting all-lowercase and all-numberless draws shrinks the space by the
 * independent acceptance factors below. Fixed dashes add no entropy.
 */
export async function passphraseEntropy(
	count: number | string,
	language = "en",
): Promise<number> {
	if (!isValidWordCount(count)) return 0;
	const n = Number(count);
	const size = (await loadWordlist(language)).length;
	return (
		n * Math.log2(size * 4 * 121) +
		Math.log2(1 - 4 ** -n) +
		Math.log2(1 - 121 ** -n)
	);
}
