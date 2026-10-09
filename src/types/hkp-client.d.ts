// The package's declaration exposes a named class, but its CommonJS runtime
// exports the constructor directly. Match that runtime default import here.
declare module "@openpgp/hkp-client" {
	export default class HKP {
		constructor(keyServerBaseUrl?: string);
		lookup(options: {
			keyId?: string;
			// HKP passes queries to encodeURIComponent, including recipient lists.
			query?: string | readonly string[];
		}): Promise<string | undefined>;
		upload(publicKeyArmored: string): Promise<Response>;
	}
}
