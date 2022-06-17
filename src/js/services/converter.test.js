import React from 'react';
import converterService from './converter';

describe('Service: converter test suite', function() {
    it('converter exists', () => {
        expect(converterService).toBeDefined();
    });

    it('toHex returns real hex values', () => {
        return expect(
            converterService.toHex(
                new Uint8Array([
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11,
                    12,
                    13,
                    14,
                    15
                ])
            )
        ).toBe('000102030405060708090a0b0c0d0e0f');
    });

    it('fromHex returns the true Uint8Array', () => {
        return expect(
            converterService.toHex(
                converterService.fromHex('000102030405060708090a0b0c0d0e0f')
            )
        ).toBe('000102030405060708090a0b0c0d0e0f');
    });

    it('toBase58 returns the true Uint8Array', () => {
        return expect(
            converterService.toBase58(
                new Uint8Array([
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11,
                    12,
                    13,
                    14,
                    15,
                    16,
                    17,
                    18,
                    19,
                    20,
                    21,
                    22,
                    23,
                    24,
                    25,
                    26,
                    27,
                    28,
                    29,
                    30,
                    31,
                    32,
                    33,
                    34,
                    35,
                    36,
                    37,
                    38,
                    39,
                    40,
                    41,
                    42,
                    43,
                    44,
                    45,
                    46,
                    47,
                    48,
                    49,
                    50,
                    51,
                    52,
                    53,
                    54,
                    55,
                    56,
                    57
                ])
            )
        ).toBe(
            '17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr'
        );
    });

    it('fromBase58 returns the true Uint8Array', () => {
        return expect(
            converterService.toBase58(
                converterService.fromBase58(
                    '17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr'
                )
            )
        ).toBe(
            '17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr'
        );
    });

    it('hexToBase58', () => {
        return expect(
            converterService.hexToBase58('000102030405060708090a0b0c0d0e0f')
        ).toBe('12drXXUifSrRnXLGbXg8E');
    });

    it('base58ToHex', () => {
        return expect(converterService.base58ToHex('12drXXUifSrRnXLGbXg8E')).toBe(
            '000102030405060708090a0b0c0d0e0f'
        );
    });

    it('uuidToHex', () => {
        return expect(
            converterService.uuidToHex('3682454d-d080-44c2-b58c-721ef6459e32')
        ).toBe('3682454dd08044c2b58c721ef6459e32');
    });

    it('hexToUuid', () => {
        return expect(
            converterService.hexToUuid('28b461d094d84a32b546f8cc382d49f0')
        ).toBe('28b461d0-94d8-4a32-b546-f8cc382d49f0');
    });

    it('wordsToHex', () => {
        return expect(
            converterService.wordsToHex([
                'lazy',
                'lock',
                'lock',
                'price',
                'economy',
                'enable',
                'arctic',
                'animal',
                'aunt',
                'damp',
                'novel',
                'party'
            ])
        ).toBe('000102030405060708090a0b0c0d0e0f');
    });

    it('hexToWords', () => {
        return expect(
            converterService.hexToWords('000102030405060708090a0b0c0d0e0f')
        ).toEqual([
            'lazy',
            'lock',
            'lock',
            'price',
            'economy',
            'enable',
            'arctic',
            'animal',
            'aunt',
            'damp',
            'novel',
            'party'
        ]);
    });

    it('fromBaseX:ambiguous alphabet', () => {
        return expect(function() {
            converterService.fromBaseX('ABAAAB', 'ABB');
        }).toThrow(new TypeError('B is ambiguous'));
    });

    it('fromBaseX:value not in alphabet', () => {
        return expect(function() {
            converterService.fromBaseX('AZB', 'AB');
        }).toThrow(new Error('Non-base2 character'));
    });

    it('fromBaseX:val.length = 0', () => {
        return expect(converterService.fromBaseX('', 'AB')).toEqual(
            new Uint8Array(0)
        );
    });

    it('toBaseX', () => {
        return expect(converterService.toBaseX('', 'AB')).toBe('');
    });

    it('encodeLatin1', () => {
        const to_encode = String.fromCharCode(0x100);
        return expect(function() {
            converterService.encodeLatin1(to_encode);
        }).toThrow(new Error('Cannot encode string in Latin1:' + to_encode));
    });
});
