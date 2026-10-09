import DOMPurify from "dompurify";
import type { SecretContent } from "../../types/vault";

/** Resolve a safe launch URL without changing the passkey's authentication scope. */
export function getPasskeyUrl(content: SecretContent): string {
	let url = content.passkey_url || "";
	if (!url.trim()) {
		const authority =
			content.passkey_rp_id?.trim() ||
			content.passkey_url_filter?.split("#")[0].trim() ||
			"";
		url = authority
			? authority.includes("://")
				? authority
				: "https://" + authority
			: "";
	}
	if (url && !DOMPurify.isValidAttribute("a", "href", url)) {
		// Apply the same protection as website-password redirects before direct launches.
		return "about:blank";
	}
	return url;
}
