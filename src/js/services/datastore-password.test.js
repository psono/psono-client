import React from 'react';
import datastorePasswordService from './datastore-password';


describe('Service: datastorePasswordService test suite #1', function() {
    it('datastorePasswordService exists', function() {
        expect(datastorePasswordService).toBeDefined();
    });

    it('escapeRegExp: strength test lowercase success', function() {
        const password = 'test'
        const characters = 'abcdefghijklmnopqrstuvwxyz'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeTruthy();
    });

    it('escapeRegExp: strength test uppercase success', function() {
        const password = 'TEST'
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeTruthy();
    });

    it('escapeRegExp: strength test lowercase failure', function() {
        const password = 'TEST'
        const characters = 'abcdefghijklmnopqrstuvwxyz'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeFalsy();
    });

    it('escapeRegExp: strength test uppercase failure', function() {
        const password = 'test'
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeFalsy();
    });

    it('escapeRegExp: strength test special chars dash success', function() {
        const password = 'test-'
        const characters = ',-.'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeTruthy();
    });

    it('escapeRegExp: strength test special chars dot success', function() {
        const password = 'test.'
        const characters = ',-.'
        const test = password.match(
            new RegExp("([" + datastorePasswordService.escapeRegExp(characters) + "])", "g")
        );
        return expect(test).toBeTruthy();
    });

});
