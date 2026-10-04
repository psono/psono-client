// Shared with the generator's complexity check so the entropy model uses the
// same character classes, including its existing ASCII letter rules.
export const passwordCharacterClasses = [
	/[A-Z]/,
	/[a-z]/,
	/[0-9]/,
	/[!§@#$%^&*()_+\-=[\]{};:'",<>.?/\\|`~]/,
];

/**
 * Shannon entropy of the generated distribution, assuming the attacker knows
 * the length, character pool and required classes. Repeated pool characters
 * are more likely to be selected and must not be counted as extra choices.
 *
 * The dynamic program tracks both probability and probability-weighted
 * information for each combination of observed classes. Conditioning on the
 * accepted combination accounts for rejection of insufficient complexity.
 */
export function passwordEntropy(length: number, characters: string): number {
	if (!Number.isInteger(length) || length <= 0 || !characters.length) return 0;

	const frequencies = new Map<string, number>();
	// The current generator selects UTF-16 code units with charAt(), not codepoints.
	for (const character of characters.split("")) {
		frequencies.set(character, (frequencies.get(character) || 0) + 1);
	}

	const groups = new Map<
		number,
		{ probability: number; information: number }
	>();
	let required = 0;
	for (const [character, frequency] of frequencies) {
		let mask = 0;
		passwordCharacterClasses.forEach((pattern, index) => {
			if (pattern.test(character)) mask |= 1 << index;
		});
		required |= mask;
		const probability = frequency / characters.length;
		const group = groups.get(mask) || { probability: 0, information: 0 };
		group.probability += probability;
		group.information -= probability * Math.log2(probability);
		groups.set(mask, group);
	}
	// Without any recognized class, the generator accepts its initial empty value.
	if (!required) return 0;

	const states = 1 << passwordCharacterClasses.length;
	let probabilities = new Float64Array(states);
	let information = new Float64Array(states);
	probabilities[0] = 1;
	for (let position = 0; position < length; position++) {
		const nextProbabilities = new Float64Array(states);
		const nextInformation = new Float64Array(states);
		for (let mask = 0; mask < states; mask++) {
			if (!probabilities[mask]) continue;
			for (const [groupMask, group] of groups) {
				const next = mask | groupMask;
				nextProbabilities[next] += probabilities[mask] * group.probability;
				nextInformation[next] +=
					information[mask] * group.probability +
					probabilities[mask] * group.information;
			}
		}
		probabilities = nextProbabilities;
		information = nextInformation;
	}

	const acceptance = probabilities[required];
	if (!acceptance) return 0;
	return Math.max(
		0,
		information[required] / acceptance + Math.log2(acceptance),
	);
}
