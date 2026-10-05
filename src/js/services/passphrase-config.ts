export const MIN_WORD_COUNT = 2;
export const MAX_WORD_COUNT = 128;
export const DEFAULT_WORD_COUNT = 4;

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
	return Object.hasOwn(wordlistLanguages, normalized) ? normalized : "en";
}

export function isValidWordCount(value: number | string): boolean {
	const count = Number(value);
	return (
		Number.isInteger(count) &&
		count >= MIN_WORD_COUNT &&
		count <= MAX_WORD_COUNT
	);
}

export function normalizeWordCount(value: unknown): number {
	const count = Number(value);
	return Number.isInteger(count) &&
		count >= MIN_WORD_COUNT &&
		count <= MAX_WORD_COUNT
		? count
		: DEFAULT_WORD_COUNT;
}
