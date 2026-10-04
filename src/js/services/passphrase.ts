import ca from "../../common/data/wordlists/ca.json";
import cs from "../../common/data/wordlists/cs.json";
import da from "../../common/data/wordlists/da.json";
import de from "../../common/data/wordlists/de.json";
import en from "../../common/data/wordlists/en.json";
import es from "../../common/data/wordlists/es.json";
import fi from "../../common/data/wordlists/fi.json";
import fr from "../../common/data/wordlists/fr.json";
import hr from "../../common/data/wordlists/hr.json";
import hu from "../../common/data/wordlists/hu.json";
import it from "../../common/data/wordlists/it.json";
import nl from "../../common/data/wordlists/nl.json";
import no from "../../common/data/wordlists/no.json";
import pl from "../../common/data/wordlists/pl.json";
import pt from "../../common/data/wordlists/pt.json";
import ru from "../../common/data/wordlists/ru.json";
import sk from "../../common/data/wordlists/sk.json";
import sv from "../../common/data/wordlists/sv.json";
import uk from "../../common/data/wordlists/uk.json";
import cryptoLibrary from "./crypto-library";
import { DEFAULT_WORD_COUNT, isValidWordCount } from "./passphrase-config";
export {
	DEFAULT_WORD_COUNT,
	MIN_WORD_COUNT,
	MAX_WORD_COUNT,
	isValidWordCount,
	normalizeWordCount,
} from "./passphrase-config";

export const wordlists: Readonly<Record<string, readonly string[]>> = {
	ca,
	cs,
	da,
	de,
	en,
	es,
	fi,
	fr,
	hr,
	hu,
	it,
	nl,
	no,
	pl,
	pt,
	ru,
	sk,
	sv,
	uk,
};
export const wordlistLanguages = {
	ca: "Català",
	cs: "Čeština",
	da: "Dansk",
	de: "Deutsch",
	en: "English",
	es: "Español",
	fi: "Suomi",
	fr: "Français",
	hr: "Hrvatski",
	hu: "Magyar",
	it: "Italiano",
	nl: "Nederlands",
	no: "Norsk (bokmål)",
	pl: "Polski",
	pt: "Português",
	ru: "Русский",
	sk: "Slovenčina",
	sv: "Svenska",
	uk: "Українська",
};

export function resolveWordlistLanguage(language?: string): string {
	const base = (language || "en").toLowerCase().split(/[-_]/)[0];
	// Frontend locales use "no"; browsers may report Bokmål as "nb".
	const normalized = base === "nb" ? "no" : base;
	return Object.hasOwn(wordlists, normalized) ? normalized : "en";
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

export function generatePassphrase(
	count: number | string = DEFAULT_WORD_COUNT,
	language = "en",
): string {
	if (!isValidWordCount(count)) {
		throw new RangeError("Invalid passphrase word count");
	}
	const words = wordlists[resolveWordlistLanguage(language)];
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
export function passphraseEntropy(
	count: number | string,
	language = "en",
): number {
	if (!isValidWordCount(count)) return 0;
	const n = Number(count);
	const size = wordlists[resolveWordlistLanguage(language)].length;
	return (
		n * Math.log2(size * 4 * 121) +
		Math.log2(1 - 4 ** -n) +
		Math.log2(1 - 121 ** -n)
	);
}
