import helper from "./helper";

let publicSuffixList;


/**
 * Loads the public suffix list and returns it
 *
 * @returns {Promise} promise
 */
async function loadPublicSuffixList() {
    const response = await fetch("/data/public-suffix-list.json");
    return response.json()
}

/**
 * Returns the public suffix list eather from cache or triggers the load
 *
 * @returns {Promise} promise
 */
async function getPublicSuffixList() {
    if (publicSuffixList) {
        return publicSuffixList;
    }
    publicSuffixList = await loadPublicSuffixList()
    return publicSuffixList;
}


/**
 * Returns public suffix for a given domain e.g. "com" for example.com or "gov.uk" for test.gov.uk or "uk" for "test.uk"
 *
 * @returns {Promise} Returns the public suffix
 */
async function getPublicSuffix(domain, privateOnly) {

    const publicSuffixList = await getPublicSuffixList()
    const searchList = privateOnly ? publicSuffixList.private : {...publicSuffixList.private, ...publicSuffixList.icann};

    // Split the domain into parts (e.g., ['uk', 'gov', 'test'] for 'test.gov.uk')
    const domainParts = domain.split('.').reverse();

    let longestPublicSuffix = '';

    // Function to search for the longest matching suffix in the provided list
    const searchForLongestSuffix = (parts) => {
        let testSuffix = '';
        for (let i = 0; i < parts.length; i++) {
            testSuffix = parts[i] + (testSuffix ? '.' + testSuffix : '');
            if (searchList[testSuffix] && testSuffix.length > longestPublicSuffix.length) {
                longestPublicSuffix = testSuffix; // Update if longer match found
            }
        }
    };

    // Search lists
    searchForLongestSuffix(domainParts);

    return longestPublicSuffix || null; // Return the longestPublicSuffix without reversing
}

/**
 * Checks whether a domain is a valid dom
 * @param domain
 * @param privateOnly
 * @returns {Promise<boolean>}
 */
async function isValidPublicDomain(domain, privateOnly) {
    if (!helper.isValidDomain(domain)) {
        return false;
    }
    const publicSuffix = await getPublicSuffix(domain, privateOnly)
    return publicSuffix !== null && publicSuffix !== domain
}



const publicSuffixService = {
    getPublicSuffix,
    isValidPublicDomain,
    getPublicSuffixList,
};

export default publicSuffixService;
