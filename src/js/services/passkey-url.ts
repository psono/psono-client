import type { SecretContent } from "../../types/vault";

/** Resolve a launch URL without changing the passkey's authentication scope. */
export function getPasskeyUrl(content: SecretContent): string {
	if (content.passkey_url?.trim()) {
		return content.passkey_url;
	}
	const authority =
		content.passkey_rp_id?.trim() ||
		content.passkey_url_filter?.split("#")[0].trim() ||
		"";
	return authority
		? authority.includes("://")
			? authority
			: "https://" + authority
		: "";
}
