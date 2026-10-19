import type { SecretContent } from "../../types/vault";

// Passkey creation calls this helper from Chrome's background service worker,
// which has no window/document. DOMPurify does not expose isValidAttribute there,
// so calling it would throw and prevent the passkey from being saved. Use its
// default href protocol and whitespace rules directly to keep validation DOM-free.
const ALLOWED_URI =
	/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const URI_WHITESPACE =
	/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

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
	if (url && !ALLOWED_URI.test(url.replace(URI_WHITESPACE, ""))) {
		// Apply the same protection as website-password redirects before direct launches.
		return "about:blank";
	}
	return url;
}
