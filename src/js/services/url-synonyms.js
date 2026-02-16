/**
 * URL Synonyms Service
 *
 * Provides URL synonym resolution to map non-canonical URLs (e.g., sign-up pages)
 * to their canonical equivalents (e.g., login pages). This ensures passwords are
 * stored with consistent URLs for better matching and retrieval.
 */

/**
 * URL Synonyms Mapping
 *
 * Maps non-canonical URLs to their canonical equivalents.
 * Used during password storage to ensure consistent URL references.
 *
 * Key: Non-canonical URL (e.g., signup/register page)
 * Value: Canonical URL (e.g., login page)
 *
 * Matching is exact and case-sensitive. Add new mappings as discovered.
 */
const URL_SYNONYMS = {
    "https://dash.cloudflare.com/sign-up": "https://dash.cloudflare.com/login",
    "https://github.com/signup": "https://github.com/login",
    "https://gitlab.com/users/sign_up": "https://gitlab.com/users/sign_in",
    "https://accounts.google.com/lifecycle/steps/signup/password": "https://accounts.google.com/signin",
    "https://www.amazon.com/ap/signin": "https://www.amazon.com",
    "https://de-de.facebook.com/r.php": "https://de-de.facebook.com",
    "https://www.facebook.com/r.php": "https://www.facebook.com",
    "https://www.instagram.com/accounts/emailsignup": "https://www.instagram.com",
    "https://x.com/i/flow/signup": "https://x.com/i/flow/login",
    "https://www.netflix.com/de-en/login": "https://www.netflix.com/de-en/login",
    "https://www.linkedin.com/signup": "https://www.linkedin.com/uas/login",
    "https://signup.ebay.de/pa/crte": "https://signin.ebay.de/signin/",
    "https://signup.ebay.com/pa/crte": "https://signin.ebay.com/signin/",
    "https://signup.ebay.com.au/pa/crte": "https://signin.ebay.com.au/signin/",
    "https://signup.ebay.co.uk/pa/crte": "https://signin.ebay.co.uk/signin/",
    "https://www.psono.pw/register.html": "https://www.psono.pw",
    "https://stackoverflow.com/users/signup": "https://stackoverflow.com/users/login",
    "https://superuser.com/users/signup": "https://superuser.com/users/login",
    "https://askubuntu.com/users/signup": "https://askubuntu.com/users/login",
};

/**
 * Normalizes a URL for matching by:
 * - Stripping query parameters (? and everything after)
 * - Stripping fragments (# and everything after)
 * - Converting to lowercase
 * - Removing trailing slashes
 *
 * @param {string} url The URL to normalize
 * @returns {string} The normalized URL
 *
 * @example
 * normalizeUrl("https://Example.com/Login?user=123#section")
 * // Returns: "https://example.com/login"
 */
function normalizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return url;
    }

    // Strip query parameters (? and everything after)
    let normalized = url.split('?')[0];

    // Strip fragments (# and everything after)
    normalized = normalized.split('#')[0];

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    // Remove trailing slash
    if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

/**
 * Resolves a URL to its canonical form using the synonym mapping.
 *
 * The URL is first normalized (query params and fragments stripped, lowercased)
 * before lookup. If a mapping exists, returns the canonical URL. Otherwise,
 * returns the original URL unchanged.
 *
 * @param {string} url The URL to resolve
 * @returns {string} The canonical URL if a synonym exists, otherwise the original URL
 *
 * @example
 * resolveUrlSynonym("https://dash.cloudflare.com/sign-up?ref=banner")
 * // Returns: "https://dash.cloudflare.com/login"
 *
 * @example
 * resolveUrlSynonym("https://DASH.cloudflare.com/SIGN-UP#form")
 * // Returns: "https://dash.cloudflare.com/login" (normalized before lookup)
 *
 * @example
 * resolveUrlSynonym("https://example.com/login")
 * // Returns: "https://example.com/login" (unchanged)
 *
 * @example
 * resolveUrlSynonym(null)
 * // Returns: null (unchanged)
 */
function resolveUrlSynonym(url) {
    // Handle edge cases: null, undefined, empty strings
    if (!url || typeof url !== 'string') {
        return url;
    }

    // Normalize URL for lookup
    const normalizedUrl = normalizeUrl(url);

    // Lookup using normalized URL
    if (URL_SYNONYMS.hasOwnProperty(normalizedUrl)) {
        return URL_SYNONYMS[normalizedUrl];
    }

    // No synonym found, return original URL
    return url;
}

/**
 * Service export
 */
const urlSynonymsService = {
    resolveUrlSynonym: resolveUrlSynonym,
    URL_SYNONYMS: URL_SYNONYMS, // Export for testing/debugging purposes
};

export default urlSynonymsService;
