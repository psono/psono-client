import React from 'react';
import domainSynonymsService from './domain-synonyms';
import helperService from './helper';

let mockServerSynonyms = [];
let mockCustomSynonyms = [];
let mockDomainSynonymMap = {};

jest.mock('./store', () => ({
    getStore: () => ({
        getState: () => ({
            server: {
                domainSynonyms: mockServerSynonyms,
                domainSynonymMap: mockDomainSynonymMap
            },
            settingsDatastore: {
                customDomainSynonyms: mockCustomSynonyms
            }
        })
    })
}));

function rebuildMockMap() {
    mockDomainSynonymMap = helperService.buildDomainSynonymMap(mockServerSynonyms, mockCustomSynonyms);
}

function setMockServerSynonyms(synonyms) {
    mockServerSynonyms = synonyms;
    rebuildMockMap();
}

function setMockCustomSynonyms(synonyms) {
    mockCustomSynonyms = synonyms;
    rebuildMockMap();
}

describe('Service: domain-synonyms test suite', function() {
    beforeEach(() => {
        mockServerSynonyms = [];
        mockCustomSynonyms = [];
        rebuildMockMap();
    });

    it('domain-synonyms service exists', function() {
        expect(domainSynonymsService).toBeDefined();
    });

    it('getHardcodedSynonyms returns hardcoded groups', function() {
        const hardcoded = domainSynonymsService.getHardcodedSynonyms();
        expect(hardcoded).toBeDefined();
        expect(Array.isArray(hardcoded)).toBe(true);
        expect(hardcoded.length).toBeGreaterThan(0);
    });

    describe('getSynonymsForDomain', function() {
        it('returns synonyms for microsoft.com', function() {
            const synonyms = domainSynonymsService.getSynonymsForDomain('microsoft.com');
            expect(synonyms).toContain('live.com');
            expect(synonyms).toContain('outlook.com');
            expect(synonyms).toContain('office.com');
            expect(synonyms).not.toContain('microsoft.com'); // Should not include itself
        });

        it('returns synonyms for google.com', function() {
            const synonyms = domainSynonymsService.getSynonymsForDomain('google.com');
            expect(synonyms).toContain('youtube.com');
            expect(synonyms).toContain('gmail.com');
        });

        it('returns empty array for non-synonym domain', function() {
            const synonyms = domainSynonymsService.getSynonymsForDomain('example.com');
            expect(synonyms).toEqual([]);
        });

        it('returns empty array for empty input', function() {
            const synonyms = domainSynonymsService.getSynonymsForDomain('');
            expect(synonyms).toEqual([]);
        });

        it('handles case-insensitive matching', function() {
            const synonyms1 = domainSynonymsService.getSynonymsForDomain('MICROSOFT.COM');
            const synonyms2 = domainSynonymsService.getSynonymsForDomain('microsoft.com');
            expect(synonyms1).toEqual(synonyms2);
        });

        it('includes custom synonyms when set', function() {
            setMockCustomSynonyms([
                ['mycompany.com', 'mycompany.net', 'mycompany.org']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('mycompany.com');
            expect(synonyms).toContain('mycompany.net');
            expect(synonyms).toContain('mycompany.org');
        });
    });

    describe('expandUrlFilterWithSynonyms', function() {
        it('expands single domain with synonyms', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com');
            expect(expanded).toContain('microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('outlook.com');
            expect(expanded).toContain('office.com');
        });

        it('keeps non-synonym domains as-is', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('example.com');
            expect(expanded).toBe('example.com');
        });

        it('handles empty input', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('');
            expect(expanded).toBe('');
        });

        it('handles null/undefined input', function() {
            const expanded1 = domainSynonymsService.expandUrlFilterWithSynonyms(null);
            expect(expanded1).toBe('');
            const expanded2 = domainSynonymsService.expandUrlFilterWithSynonyms(undefined);
            expect(expanded2).toBe('');
        });

        it('expands with wildcard prefix (synonyms added as-is)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('*.microsoft.com');
            expect(expanded).toContain('*.microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('outlook.com');
            expect(expanded).toContain('office.com');
            expect(expanded).toContain('*.live.com');
        });

        it('does not expand with port suffix (specific port blocks synonym expansion)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com:8080');
            expect(expanded).toContain('microsoft.com:8080');
            expect(expanded).not.toContain('live.com');
            expect(expanded).not.toContain('outlook.com');
            expect(expanded).not.toContain('office.com');
            expect(expanded).not.toContain('*.live.com');
        });

        it('expands with wildcard port (synonyms added as-is)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com:*');
            expect(expanded).toContain('microsoft.com:*');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('outlook.com');
            expect(expanded).toContain('office.com');
            expect(expanded).toContain('*.live.com');
        });

        it('does not expand with both wildcard and specific port', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('*.microsoft.com:8080');
            expect(expanded).toContain('*.microsoft.com:8080');
            expect(expanded).not.toContain('live.com');
            expect(expanded).not.toContain('outlook.com');
            expect(expanded).not.toContain('office.com');
            expect(expanded).not.toContain('*.live.com');
        });

        it('handles multiple domains in input (space-separated)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com example.com');
            expect(expanded).toContain('microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('outlook.com');
            expect(expanded).toContain('office.com');
            expect(expanded).toContain('example.com');
        });

        it('handles multiple domains in input (comma-separated)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com,example.com');
            expect(expanded).toContain('microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('example.com');
        });

        it('handles multiple domains in input (semicolon-separated)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com;example.com');
            expect(expanded).toContain('microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('example.com');
        });

        it('removes duplicate domains', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com live.com');
            const parts = expanded.split(' ');
            const uniqueParts = new Set(parts);
            expect(parts.length).toBe(uniqueParts.size);
        });

        it('handles mixed synonym and non-synonym domains', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('microsoft.com example.com google.com');
            expect(expanded).toContain('microsoft.com');
            expect(expanded).toContain('live.com');
            expect(expanded).toContain('outlook.com');
            expect(expanded).toContain('office.com');
            expect(expanded).toContain('google.com');
            expect(expanded).toContain('youtube.com');
            expect(expanded).toContain('gmail.com');
            expect(expanded).toContain('example.com');
        });

        it('handles custom synonym groups', function() {
            setMockCustomSynonyms([
                ['mycompany.com', 'mycompany.net']
            ]);
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('mycompany.com');
            expect(expanded).toContain('mycompany.com');
            expect(expanded).toContain('mycompany.net');
        });

        it('case-insensitive expansion', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('MICROSOFT.COM');
            expect(expanded.toLowerCase()).toContain('microsoft.com');
            expect(expanded.toLowerCase()).toContain('live.com');
        });

        it('expands subdomain with wildcard synonym group (eBay case)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('signin.ebay.de');
            expect(expanded).toContain('signin.ebay.de');
            expect(expanded).toContain('*.ebay.com');
            expect(expanded).toContain('*.ebay.co.uk');
            expect(expanded).toContain('*.ebay.com.au');
        });

        it('base domain should NOT match wildcard pattern (only direct subdomains)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('ebay.de');
            expect(expanded).toContain('ebay.de');
            // Should NOT expand synonyms because ebay.de doesn't match *.ebay.de
            expect(expanded).not.toContain('*.ebay.com');
            expect(expanded).not.toContain('*.ebay.co.uk');
            expect(expanded).not.toContain('*.ebay.com.au');
        });

        it('expands wildcard entry with wildcard synonym group', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('*.ebay.de');
            expect(expanded).toContain('*.ebay.de');
            expect(expanded).toContain('*.ebay.com');
            expect(expanded).toContain('*.ebay.co.uk');
            expect(expanded).toContain('*.ebay.com.au');
        });

        it('multi-level subdomain should NOT match wildcard pattern (only direct subdomains)', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('www.signin.ebay.de');
            expect(expanded).toContain('www.signin.ebay.de');
            // Should NOT expand synonyms because www.signin.ebay.de has nested subdomains
            expect(expanded).not.toContain('*.ebay.com');
            expect(expanded).not.toContain('*.ebay.co.uk');
            expect(expanded).not.toContain('*.ebay.com.au');
        });

        it('does not expand subdomain with specific port', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('signin.ebay.de:8080');
            expect(expanded).toContain('signin.ebay.de:8080');
            // Should NOT expand synonyms because the port isn't part of the synonyms
            expect(expanded).not.toContain('*.ebay.com');
            expect(expanded).not.toContain('*.ebay.co.uk');
            expect(expanded).not.toContain('*.ebay.com.au');
        });

        it('does not expand wildcard subdomain with specific port', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('*.ebay.de:443');
            expect(expanded).toContain('*.ebay.de:443');
            // Should NOT expand synonyms because the port isn't part of the synonyms
            expect(expanded).not.toContain('*.ebay.com');
            expect(expanded).not.toContain('*.ebay.co.uk');
            expect(expanded).not.toContain('*.ebay.com.au');
        });

        it('handles Apple subdomain matching', function() {
            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('signin.apple.com');
            expect(expanded).toContain('signin.apple.com');
            expect(expanded).toContain('apple.com');
            expect(expanded).toContain('icloud.com');
            expect(expanded).toContain('me.com');
            expect(expanded).toContain('account.apple.com');
            expect(expanded).toContain('*.store.apple.com');
        });
    });

    describe('server synonyms', function() {
        it('uses server synonyms correctly', function() {
            setMockServerSynonyms([
                ['serverdomain1.com', 'serverdomain2.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('serverdomain1.com');
            expect(synonyms).toContain('serverdomain2.com');
        });

        it('handles empty array', function() {
            setMockServerSynonyms([]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('anydomain.com');
            expect(synonyms).toEqual([]);
        });

        it('normalizes domains to lowercase', function() {
            setMockServerSynonyms([
                ['ServerDomain1.COM', 'SERVERDOMAIN2.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('serverdomain1.com');
            expect(synonyms).toContain('serverdomain2.com');
        });

        it('allows multiple server groups', function() {
            setMockServerSynonyms([
                ['servergroup1a.com', 'servergroup1b.com'],
                ['servergroup2a.com', 'servergroup2b.com']
            ]);
            const synonyms1 = domainSynonymsService.getSynonymsForDomain('servergroup1a.com');
            expect(synonyms1).toContain('servergroup1b.com');
            expect(synonyms1).not.toContain('servergroup2a.com');

            const synonyms2 = domainSynonymsService.getSynonymsForDomain('servergroup2a.com');
            expect(synonyms2).toContain('servergroup2b.com');
            expect(synonyms2).not.toContain('servergroup1a.com');
        });

        it('server synonyms work alongside hardcoded synonyms', function() {
            setMockServerSynonyms([
                ['servercompany.com', 'servercompany.net']
            ]);
            const serverSynonyms = domainSynonymsService.getSynonymsForDomain('servercompany.com');
            expect(serverSynonyms).toContain('servercompany.net');

            const hardcodedSynonyms = domainSynonymsService.getSynonymsForDomain('microsoft.com');
            expect(hardcodedSynonyms).toContain('live.com');
        });

        it('getServerSynonyms returns server-provided groups', function() {
            const testGroups = [
                ['serverdomain1.com', 'serverdomain2.com'],
                ['serverdomain3.com', 'serverdomain4.com']
            ];
            setMockServerSynonyms(testGroups);
            const serverGroups = domainSynonymsService.getServerSynonyms();
            expect(serverGroups.length).toBe(2);
        });
    });

    describe('custom synonyms', function() {
        it('uses custom synonyms correctly', function() {
            setMockCustomSynonyms([
                ['domain1.com', 'domain2.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('domain1.com');
            expect(synonyms).toContain('domain2.com');
        });

        it('handles empty array', function() {
            setMockCustomSynonyms([]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('anydo main.com');
            expect(synonyms).toEqual([]);
        });

        it('handles invalid input gracefully', function() {
            setMockCustomSynonyms(null);
            const synonyms = domainSynonymsService.getSynonymsForDomain('anydomain.com');
            expect(synonyms).toEqual([]);
        });

        it('normalizes domains to lowercase', function() {
            setMockCustomSynonyms([
                ['Domain1.COM', 'DOMAIN2.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('domain1.com');
            expect(synonyms).toContain('domain2.com');
        });

        it('filters out empty domains', function() {
            setMockCustomSynonyms([
                ['domain1.com', '', 'domain2.com', '  ', 'domain3.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('domain1.com');
            expect(synonyms).toContain('domain2.com');
            expect(synonyms).toContain('domain3.com');
            expect(synonyms).not.toContain('');
            expect(synonyms.length).toBe(2);
        });

        it('allows multiple custom groups', function() {
            setMockCustomSynonyms([
                ['group1a.com', 'group1b.com'],
                ['group2a.com', 'group2b.com']
            ]);
            const synonyms1 = domainSynonymsService.getSynonymsForDomain('group1a.com');
            expect(synonyms1).toContain('group1b.com');
            expect(synonyms1).not.toContain('group2a.com');

            const synonyms2 = domainSynonymsService.getSynonymsForDomain('group2a.com');
            expect(synonyms2).toContain('group2b.com');
            expect(synonyms2).not.toContain('group1a.com');
        });
    });

    describe('Wildcard pattern matching behavior', function() {
        it('*.blub.com should match direct subdomain sub.blub.com', function() {
            setMockCustomSynonyms([
                ['*.blub.com', 'test.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('sub.blub.com');
            expect(synonyms).toContain('test.com');
        });

        it('*.blub.com should NOT match base domain blub.com', function() {
            setMockCustomSynonyms([
                ['*.blub.com', 'test.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('blub.com');
            expect(synonyms).not.toContain('test.com');
            expect(synonyms).toEqual([]);
        });

        it('*.blub.com should NOT match nested subdomain sub.sub.blub.com', function() {
            setMockCustomSynonyms([
                ['*.blub.com', 'test.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('sub.sub.blub.com');
            expect(synonyms).not.toContain('test.com');
            expect(synonyms).toEqual([]);
        });

        it('*.blub.com should match multiple direct subdomains', function() {
            setMockCustomSynonyms([
                ['*.blub.com', 'test.com']
            ]);
            const synonyms1 = domainSynonymsService.getSynonymsForDomain('login.blub.com');
            expect(synonyms1).toContain('test.com');

            const synonyms2 = domainSynonymsService.getSynonymsForDomain('api.blub.com');
            expect(synonyms2).toContain('test.com');

            const synonyms3 = domainSynonymsService.getSynonymsForDomain('www.blub.com');
            expect(synonyms3).toContain('test.com');
        });
    });

    describe('Merging synonym groups', function() {
        it('merges server and custom synonyms when they overlap', function() {
            setMockServerSynonyms([
                ['overlap.com', 'serversynonym.com']
            ]);
            setMockCustomSynonyms([
                ['overlap.com', 'customsynonym.com']
            ]);
            const synonyms = domainSynonymsService.getSynonymsForDomain('overlap.com');
            expect(synonyms).toContain('customsynonym.com');
            expect(synonyms).toContain('serversynonym.com');
        });

        it('merged groups work bidirectionally', function() {
            setMockServerSynonyms([
                ['companyA.com', 'companyA.net']
            ]);
            setMockCustomSynonyms([
                ['companyA.com', 'companyA.org']
            ]);

            const synonymsFromCom = domainSynonymsService.getSynonymsForDomain('companyA.com');
            expect(synonymsFromCom).toContain('companya.net');
            expect(synonymsFromCom).toContain('companya.org');

            const synonymsFromNet = domainSynonymsService.getSynonymsForDomain('companyA.net');
            expect(synonymsFromNet).toContain('companya.com');
            expect(synonymsFromNet).toContain('companya.org');

            const synonymsFromOrg = domainSynonymsService.getSynonymsForDomain('companyA.org');
            expect(synonymsFromOrg).toContain('companya.com');
            expect(synonymsFromOrg).toContain('companya.net');
        });

        it('expands with merged synonym groups', function() {
            setMockServerSynonyms([
                ['testdomain.com', 'testdomain.net']
            ]);
            setMockCustomSynonyms([
                ['testdomain.com', 'testdomain.org']
            ]);

            const expanded = domainSynonymsService.expandUrlFilterWithSynonyms('testdomain.com');
            expect(expanded).toContain('testdomain.com');
            expect(expanded).toContain('testdomain.net');
            expect(expanded).toContain('testdomain.org');
        });
    });
});
