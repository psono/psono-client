/**
 * Service for managing domain synonym groups.
 * Allows password entries to match across related domains (e.g., microsoft.com and live.com).
 */

import { getStore } from "./store";
import helperService from "./helper";


/**
 * Extracts the base domain from a URL filter pattern
 * Handles wildcards (*.example.com) and ports (example.com:8080)
 *
 * @param {string} pattern - URL filter pattern
 * @returns {object} Object with { baseDomain, prefix, suffix }
 */
function parseFilterPattern(pattern) {
    let prefix = '';
    let suffix = '';
    let baseDomain = pattern;

    // Handle wildcard prefix (*.example.com)
    if (pattern.startsWith('*.')) {
        prefix = '*.';
        baseDomain = pattern.substring(2);
    }

    // Handle port suffix (example.com:8080 or example.com:*)
    const portIndex = baseDomain.indexOf(':');
    if (portIndex !== -1) {
        suffix = baseDomain.substring(portIndex);
        baseDomain = baseDomain.substring(0, portIndex);
    }

    return { baseDomain, prefix, suffix };
}

/**
 * Check if a domain matches a pattern (including wildcard patterns)
 *
 * @param {string} domain - The domain to check
 * @param {string} pattern - The pattern (may include wildcards like *.example.com)
 * @returns {boolean} True if the domain matches the pattern
 */
function domainMatchesPattern(domain, pattern) {
    const domainLower = domain.toLowerCase();
    const patternLower = pattern.toLowerCase();

    if (domainLower === patternLower) {
        return true;
    }

    if (patternLower.startsWith('*.')) {
        const basePattern = patternLower.substring(2);

        // Check if domain ends with .basePattern
        if (!domainLower.endsWith('.' + basePattern)) {
            return false;
        }

        // Extract the subdomain part
        const subdomain = domainLower.substring(0, domainLower.length - basePattern.length - 1);

        // Only match direct subdomains (no dots in the subdomain part)
        return subdomain.indexOf('.') === -1;
    }

    return false;
}

/**
 * Find the synonym group for a given domain
 *
 * @param {string} domain - The domain to find synonyms for
 * @returns {Array<string>|null} The synonym group, or null if not found
 */
function findSynonymGroup(domain) {
    if (!domain) {
        return null;
    }

    const state = getStore().getState();
    const domainToGroupMap = state.server.domainSynonymMap || {};
    const normalizedDomain = domain.toLowerCase();

    const exactGroup = domainToGroupMap[normalizedDomain];
    if (exactGroup) {
        return exactGroup;
    }

    for (let pattern in domainToGroupMap) {
        if (domainMatchesPattern(domain, pattern)) {
            return domainToGroupMap[pattern];
        }
    }

    return null;
}

/**
 * Get all synonym domains for a given domain
 *
 * @param {string} domain - The domain to find synonyms for
 * @param {boolean} includeCustom - Whether to include custom synonyms (default: true)
 * @returns {Array<string>} Array of synonym domains (excluding the input domain)
 */
function getSynonymsForDomain(domain, includeCustom = true) {
    const group = findSynonymGroup(domain);

    if (!group) {
        return [];
    }

    return group.filter(d => !domainMatchesPattern(domain, d));
}


/**
 * Expands a URL filter string with synonym domains
 *
 * @param {string} urlFilter - URL filter string (space/comma/semicolon-separated)
 * @returns {string} Expanded URL filter string with synonyms
 */
function expandUrlFilterWithSynonyms(urlFilter) {
    if (!urlFilter || typeof urlFilter !== 'string') {
        return '';
    }

    const filters = urlFilter.split(/\s+|,|;/).filter(f => f.trim());

    if (filters.length === 0) {
        return '';
    }

    const expandedFilters = new Set();

    filters.forEach(filter => {
        const trimmedFilter = filter.trim();
        if (!trimmedFilter) {
            return;
        }

        expandedFilters.add(trimmedFilter);

        const { baseDomain, prefix, suffix } = parseFilterPattern(trimmedFilter);

        // If there's a specific port (not wildcard), don't expand synonyms
        if (suffix && suffix !== ':*') {
            return;
        }

        // Try to find the synonym group in order of specificity:
        // 1. Full filter with prefix and suffix (e.g., "*.ebay.de:443")
        // 2. Prefix + baseDomain (e.g., "*.ebay.de" without port)
        // 3. Just the baseDomain (e.g., "ebay.de")
        let group = findSynonymGroup(trimmedFilter);

        if (!group && prefix) {
            group = findSynonymGroup(prefix + baseDomain);
        }

        if (!group) {
            group = findSynonymGroup(baseDomain);
        }

        if (!group) {
            return;
        }

        group.forEach(synonymPattern => {
            if (domainMatchesPattern(baseDomain, synonymPattern)) {
                return;
            }

            expandedFilters.add(synonymPattern);
        });
    });

    return Array.from(expandedFilters).join(' ');
}


/**
 * Get all hardcoded synonym groups (for display in UI)
 *
 * @returns {Array<Array<string>>} Array of hardcoded synonym groups
 */
function getHardcodedSynonyms() {
    return helperService.getHardcodedDomainSynonyms();
}

/**
 * Get all server-provided synonym groups (for display in UI)
 *
 * @returns {Array<Array<string>>} Array of server-provided synonym groups
 */
function getServerSynonyms() {
    const state = getStore().getState();
    return (state.server && state.server.domainSynonyms) || [];
}

const domainSynonymsService = {
    getSynonymsForDomain: getSynonymsForDomain,
    expandUrlFilterWithSynonyms: expandUrlFilterWithSynonyms,
    getHardcodedSynonyms: getHardcodedSynonyms,
    getServerSynonyms: getServerSynonyms,
};

export default domainSynonymsService;
