import publicSuffixService from './public-suffix';

function mockFetch() {
    return jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: function() {
                return {
                    "icann": {
                        "com": 1,
                        "de": 1,
                        "app": 1,
                        "uk": 1,
                        "gov.uk": 2,
                    },
                    "private": {
                        "netlify.app": 2,
                        "compute.amazonaws.com": 4,
                    }
                }
            },
        }),
    );
}

describe('Service: passkey test suite', function() {
    it('passkey exists', function() {
        expect(publicSuffixService).toBeDefined();
    });

    it('getPublicSuffix test.gov.uk -> gov.uk', async function () {
        window.fetch = mockFetch();
        expect(
            await publicSuffixService.getPublicSuffix('test.gov.uk')
        ).toEqual('gov.uk');
    });

    it('getPublicSuffix test.uk -> uk', async function () {
        window.fetch = mockFetch();
        expect(
            await publicSuffixService.getPublicSuffix('test.uk')
        ).toEqual('uk');
    });

    it('getPublicSuffix test.compute.amazonaws.com -> compute.amazonaws.com', async function () {
        window.fetch = mockFetch();
        expect(
            await publicSuffixService.getPublicSuffix('test.compute.amazonaws.com')
        ).toEqual('compute.amazonaws.com');
    });
});
