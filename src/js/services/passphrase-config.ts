export const MIN_WORD_COUNT = 2;
export const MAX_WORD_COUNT = 128;
export const DEFAULT_WORD_COUNT = 4;

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
