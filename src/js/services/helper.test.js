import React from 'react';
import helperService from './helper';

describe('Service: helper test suite', function() {
    it('helper exists', function() {
        expect(helperService).toBeDefined();
    });

    it('parse_url www domain', function() {
        expect(
            helperService.parseUrl('https://www.example.com/url-part/#is-not-part')
        ).toEqual({
            scheme: 'https',
            authority: 'www.example.com',
            authority_without_www: 'example.com',
            base_url: "https://www.example.com",
            full_domain: 'www.example.com',
            full_domain_without_www: 'example.com',
            top_domain: 'www.example.com',
            port: null,
            path: '/url-part/',
            query: undefined,
            fragment: 'is-not-part'
        });
    });

    it('parse_url top lvl domain', function() {
        expect(
            helperService.parseUrl('https://example.com/url-part/#is-not-part')
        ).toEqual({
            scheme: 'https',
            authority: 'example.com',
            authority_without_www: 'example.com',
            base_url: "https://example.com",
            full_domain: 'example.com',
            full_domain_without_www: "example.com",
            top_domain: 'example.com',
            port: null,
            path: '/url-part/',
            query: undefined,
            fragment: 'is-not-part'
        });
    });

    it('parse_url sub domain', function() {
        expect(
            helperService.parseUrl('chrome-extension://nknmfipbcebafiaclacheccehghgikkk/data/index.html#!/account/multifactor-authentication')
        ).toEqual({
            scheme: 'chrome-extension',
            authority: 'nknmfipbcebafiaclacheccehghgikkk',
            authority_without_www: 'nknmfipbcebafiaclacheccehghgikkk',
            base_url: 'chrome-extension://nknmfipbcebafiaclacheccehghgikkk',
            full_domain: 'nknmfipbcebafiaclacheccehghgikkk',
            full_domain_without_www: "nknmfipbcebafiaclacheccehghgikkk",
            top_domain: 'nknmfipbcebafiaclacheccehghgikkk',
            port: null,
            path: '/data/index.html',
            query: undefined,
            fragment: '!/account/multifactor-authentication'
        });
    });

    it('parse_url sub domain', function() {
        expect(
            helperService.parseUrl('http://test.example.com/url-part/#is-not-part')
        ).toEqual({
            scheme: 'http',
            authority: 'test.example.com',
            authority_without_www: 'test.example.com',
            base_url: 'http://test.example.com',
            full_domain: 'test.example.com',
            full_domain_without_www: 'test.example.com',
            top_domain: 'test.example.com',
            port: null,
            path: '/url-part/',
            query: undefined,
            fragment: 'is-not-part'
        });
    });

    it('parse_url sub domain with port', function() {
        expect(
            helperService.parseUrl(
                'http://test.example.com:6000/url-part/#is-not-part'
            )
        ).toEqual({
            scheme: 'http',
            authority: 'test.example.com:6000',
            authority_without_www: 'test.example.com:6000',
            base_url: "http://test.example.com:6000",
            full_domain: 'test.example.com',
            full_domain_without_www: 'test.example.com',
            top_domain: 'test.example.com',
            port: '6000',
            path: '/url-part/',
            query: undefined,
            fragment: 'is-not-part'
        });
    });

    it('getDomainWithoutWww sub domain', function() {
        expect(
            helperService.getDomainWithoutWww('http://test.example.com/url-part/#is-not-part')
        ).toEqual('test.example.com');
    });

    it('getDomain www domain', function() {
        expect(
            helperService.getDomainWithoutWww('http://www.example.com/url-part/#is-not-part')
        ).toEqual('example.com');
    });

    it('getDomain top level domain', function() {
        expect(
            helperService.getDomainWithoutWww('http://example.com/url-part/#is-not-part')
        ).toEqual('example.com');
    });

    it('arrayStartsWith a no array', function() {
        expect(helperService.arrayStartsWith('a', ['a'])).toBeFalsy();
    });

    it('arrayStartsWith b no array', function() {
        expect(helperService.arrayStartsWith(['a'], 'a')).toBeFalsy();
    });

    it('arrayStartsWith a.length < b.lenght', function() {
        expect(helperService.arrayStartsWith(['a'], ['a', 'b'])).toBeFalsy();
    });

    it('arrayStartsWith a = b', function() {
        expect(helperService.arrayStartsWith(['a', 'b'], ['a', 'b'])).toBeTruthy();
    });

    it('arrayStartsWith a != b', function() {
        expect(helperService.arrayStartsWith(['a', 'b'], ['a', 'c'])).toBeFalsy();
    });

    it('arrayStartsWith a starts with b', function() {
        expect(
            helperService.arrayStartsWith(['a', 'b', 'c'], ['a', 'b'])
        ).toBeTruthy();
    });

    it('createList', function() {
        const list = [];

        helperService.createList(
            {
                items: ['a', 'b'],
                folders: [
                    {
                        items: ['c', 'd']
                        // no folders
                    },
                    {
                        // two folder parallel
                        items: ['e', 'f'],
                        folders: [
                            {
                                // at least two folder level handled
                                items: ['g', 'h'],
                                folders: [
                                    // empty folders
                                ]
                            }
                        ]
                    }
                ]
            },
            list
        );

        expect(list).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    });

    it('duplicateObject', function() {
        const orig_obj = {
            a: ['b'],
            c: true
        };

        const dubl_obj = helperService.duplicateObject(orig_obj);

        expect(orig_obj).toEqual(dubl_obj);
        dubl_obj.c = false;
        expect(orig_obj).not.toEqual(dubl_obj);
    });

    it('isValidUsername not allowed chars', function() {
        expect(helperService.isValidUsername('ab@cd') === true).toBeFalsy();
    });

    it('isValidUsername too small', function() {
        expect(helperService.isValidUsername('ab') === true).toBeFalsy();
    });

    it('isValidUsername start with .', function() {
        expect(helperService.isValidUsername('.abcd') === true).toBeFalsy();
    });

    it('isValidUsername start with -', function() {
        expect(helperService.isValidUsername('-abcd') === true).toBeFalsy();
    });

    it('isValidUsername end with .', function() {
        expect(helperService.isValidUsername('abcd.') === true).toBeFalsy();
    });

    it('isValidUsername end with -', function() {
        expect(helperService.isValidUsername('abcd-') === true).toBeFalsy();
    });

    it('isValidUsername double occurrence of .', function() {
        expect(helperService.isValidUsername('abc..def') === true).toBeFalsy();
    });

    it('isValidUsername double occurrence of -', function() {
        expect(helperService.isValidUsername('abc--def') === true).toBeFalsy();
    });

    it('isValidUsername occurrence of .-', function() {
        expect(helperService.isValidUsername('abc.-def') === true).toBeFalsy();
    });

    it('isValidUsername occurrence of -.', function() {
        expect(helperService.isValidUsername('abc-.def') === true).toBeFalsy();
    });

    it('isValidUsername valid', function() {
        expect(helperService.isValidUsername('abc') === null).toBeTruthy();
    });

    it('removeFromArray', function() {
        const array = [1, 2, 5, 7];
        const search = 5;
        const target = [1, 2, 7];

        helperService.removeFromArray(array, search);

        expect(array).toEqual(target);
    });

    it('removeFromArray_own_cmp_fct', function() {
        const array = [1, 2, 5, 5, 7];
        const search = 5;
        const target = [5, 5];

        const cmp_fct = function(a, b) {
            return a !== b;
        };

        helperService.removeFromArray(array, search, cmp_fct);

        expect(array).toEqual(target);
    });

    it('formFullUsername without email syntax', function() {
        const username = 'test';
        const domain = 'example.com';

        const full_username = helperService.formFullUsername(username, domain);

        expect(full_username).toEqual(username + '@' + domain);
    });

    it('formFullUsername with email syntax', function() {
        const username = 'test@example1.com';
        const domain = 'example.com';

        const full_username = helperService.formFullUsername(username, domain);

        expect(full_username).toEqual(username);
    });

    it('isValidPassword_successful', function() {
        const password1 = 'ab123456789012';

        const is_valid = helperService.isValidPassword(password1, password1);

        expect(is_valid).toEqual(null);
    });

    it('isValidPassword_too_short', function() {
        const password1 = 'a2345678901';

        const is_valid = helperService.isValidPassword(password1, password1);

        expect(is_valid).toEqual("PASSWORD_TOO_SHORT");
    });

    it('isValidPassword_no_match', function() {
        const password1 = 'a2345678901234';
        const password2 = 'b2345678901235';

        const is_valid = helperService.isValidPassword(password1, password2);

        expect(is_valid).toEqual("PASSWORDS_DONT_MATCH");
    });

    it('isValidPassword_not_complex_enough', function() {
        const password1 = '12345678901234';
        const password2 = '12345678901234';

        const is_valid = helperService.isValidPassword(password1, password2);

        expect(is_valid).toEqual("PASSWORD_NOT_COMPLEX_ENOUGH");
    });

    it('isUrlFilterMatch direct match', function() {
        const authority = 'example.com';
        const urlFilter = 'example.com';

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy()
    });

    it('isUrlFilterMatch empty url filter', function() {
        const authority = 'example.com';
        const urlFilter = ''; // shouldn't match anything

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch empty authority', function() {
        const authority = '';
        const urlFilter = 'example.com'; // shouldn't match if the authority is empty

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch undefined authority', function() {
        const authority = undefined;
        const urlFilter = 'example.com'; // shouldn't match if the authority is undefined

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch undefined url filter', function() {
        const authority = 'example.com';
        const urlFilter = undefined; // shouldn't match anything

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch subdomains not matched', function() {
        const authority = 'sub.example.com';
        const urlFilter = 'example.com'; // shouldn't match a subdomain

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch wildcard match with sub domain', function() {
        const authority = 'sub.example.com';
        const urlFilter = '*.example.com';

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy()
    });

    it('isUrlFilterMatch wildcard match with sub sub domain', function() {
        const authority = 'sub.sub.example.com';
        const urlFilter = '*.example.com';

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy()
    });

    it('isUrlFilterMatch wildcard match with invalid wildcard', function() {
        const authority = 'sub.sub.example.com';
        const urlFilter = '*example.com'; // potentially dangerous (e.g. evilexample.com) so shouldn't match

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });

    it('isUrlFilterMatch wildcard match with apex domain', function() {
        const authority = 'example.com';
        const urlFilter = '*.example.com';

        expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy()
    });
});
