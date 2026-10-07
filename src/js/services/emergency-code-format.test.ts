import converter from "./converter";
import crypto from "./crypto-library";
import {
	generateEmergencyCode,
	getEmergencyCodeParameters,
	emergencyCodeFromInput,
	emergencyCodeFromWords,
	LEGACY_EMERGENCY_PARAMETERS,
} from "./emergency-code-format";

const entropy = Uint8Array.from({ length: 16 }, (_, index) => index);
const stronger = { u: 15, r: 8, p: 1, l: 64 };
const vectorHex =
	"5053454301010f400000000800000001000102030405060708090a0b0c0d0e0f";

describe("emergency code format", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(crypto, "randomBytes").mockReturnValue(entropy);
	});
	afterEach(() => {
		jest.restoreAllMocks();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it.each([
		LEGACY_EMERGENCY_PARAMETERS,
		stronger,
	])("round trips codes and phrases: %p", (parameters) => {
		const generated = generateEmergencyCode("scrypt", parameters);
		expect(getEmergencyCodeParameters(generated.base58)).toEqual(parameters);
		expect(
			emergencyCodeFromInput(
				generated.base58_checksums.match(/.{1,13}/g)!.join(" - "),
			),
		).toBe(generated.base58);
		expect(
			emergencyCodeFromWords(generated.words.join("  ").toUpperCase()),
		).toBe(generated.base58);
		expect(generated.words.length).toBe(parameters.u === 14 ? 12 : 24);
		if (parameters.u !== 14) {
			expect(generated.bytes.slice(-16)).toEqual(entropy);
		}
	});

	it("preserves the versioned parameters independently of later defaults", () => {
		const generated = generateEmergencyCode("scrypt", stronger);
		expect(generated.hex).toBe(vectorHex);
		generateEmergencyCode("scrypt", { ...stronger, u: 16 });
		expect(getEmergencyCodeParameters(generated.base58)).toEqual(stronger);
		expect(generated.base58).toBe(
			"6QZG84jVp2h4qCi6WQmnMBeksqPzA3huq4tUwdSZ7gP8",
		);
		expect(generated.base58_checksums).toBe(
			"6QZG84jVp2hmN4qCi6WQmnMBPDeksqPzA3huq5S4tUwdSZ7gP838",
		);
		expect(generated.words.join(" ")).toBe(
			"grit collect honey pear car cart absurd absurd absurd ability ability ability lazy lock lock price economy enable arctic animal aunt damp novel party",
		);
		expect(
			crypto.generateAuthkey(
				"code@example.com",
				generated.base58,
				"scrypt",
				stronger,
			),
		).toBe(
			"4a1867272694ca1ad913efb4732b87176d5279653193bbf6840ccbf22253118740381b08d57beca69860d960757913eba197c032031eb09a382bbd6bbe8d95cb",
		);
	});

	it("rejects corrupted checksums and unsupported descriptors", () => {
		const generated = generateEmergencyCode("scrypt", stronger);
		expect(() =>
			emergencyCodeFromInput(generated.base58_checksums.slice(0, -1) + "0"),
		).toThrow();
		const bytes = converter.fromHex(vectorHex);
		bytes[4] = 2;
		expect(() =>
			getEmergencyCodeParameters(converter.toBase58(bytes)),
		).toThrow();
		expect(() => emergencyCodeFromWords("unknown ".repeat(24))).toThrow();
	});

	it("binds the descriptor into the authentication password", () => {
		const generated = generateEmergencyCode("scrypt", stronger);
		const changed = converter.fromHex(vectorHex);
		changed[6] = 16;
		const changedCode = converter.toBase58(changed);
		expect(
			crypto.generateAuthkey(
				"code@example.com",
				changedCode,
				"scrypt",
				getEmergencyCodeParameters(changedCode),
			),
		).not.toBe(
			crypto.generateAuthkey(
				"code@example.com",
				generated.base58,
				"scrypt",
				stronger,
			),
		);
	});
});
