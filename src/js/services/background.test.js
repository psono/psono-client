import React from 'react';
import backgroundService from './background';
import converterService from "./converter";

describe('Service: helper test suite', function() {
    it('helper exists', function() {
        expect(backgroundService).toBeDefined();
    });

    it('urlfilter with perfect match of a regular domains', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "example.com",
        }
        return expect(
            filter(leaf)
        ).toBeTruthy()
    });

    it('urlfilter with different ports should not pass secrets', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('http://example.com:8000/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "example.com",
        }
        return expect(
            filter(leaf)
        ).toBeFalsy()
    });

    it('urlfilter with www works for www domains', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://www.example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "www.example.com",
        }
        return expect(
            filter(leaf)
        ).toBeTruthy()
    });

    it('urlfilter should match subdomains', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://abc.example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "example.com",
        }
        return expect(
            filter(leaf)
        ).toBeTruthy()
    });

    it('urlfilter should match subdomains (including www.)', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://www.example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "example.com",
        }
        return expect(
            filter(leaf)
        ).toBeTruthy()
    });

    it('urlfilter with multiple domains', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://www.example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "example.com, narf.com",
        }
        return expect(
            filter(leaf)
        ).toBeTruthy()
    });

    it('urlfilter www url filter should not match a site without www.)', () => {
        const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter('https://example.com/url-part/#is-not-part')
        const leaf = {
            type: "website_password",
            urlfilter: "www.example.com",
        }
        return expect(
            filter(leaf)
        ).toBeFalsy()
    });
});
