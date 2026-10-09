import type { ScryptParameters } from "../../types/crypto";

export function getHashingUpgrade(
	algorithm: string | undefined,
	current: ScryptParameters | undefined,
	defaultAlgorithm: string,
	defaults: ScryptParameters,
): ScryptParameters | null {
	if (
		algorithm !== "scrypt" ||
		defaultAlgorithm !== algorithm ||
		current?.l !== 64 ||
		defaults.l !== 64
	) {
		return null;
	}
	const target = { u: 14, r: 8, p: 1, l: 64 };
	let stronger = false;
	for (const name of ["u", "r", "p"] as const) {
		const old = current[name];
		const next = defaults[name];
		if (
			typeof old !== "number" ||
			typeof next !== "number" ||
			!Number.isSafeInteger(old) ||
			!Number.isSafeInteger(next) ||
			Math.min(old, next) < target[name]
		) {
			return null;
		}
		target[name] = Math.max(old, next);
		stronger ||= target[name] > old;
	}
	return stronger ? target : null;
}
