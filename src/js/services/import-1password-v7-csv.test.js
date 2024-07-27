import React from 'react';
import import1PasswordV7Csv from './import-1password-v7-csv';
import cryptoLibrary from "../services/crypto-library";


describe('Service: import1PasswordV7Csv test suite', function () {

    it('helper exists', function() {
        expect(import1PasswordV7Csv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "\"UUID\",\"TITLE\",\"USERNAME\",\"PASSWORD\",\"SCOPE\",\"AUTOSUBMIT\",\"NOTES\",\"URL\",\"URLS\",\"SECTION_UNAZHCO2FJN3VMOVECXJ6VAPVQ 1: ONE-TIME PASSWORD\",\"SECTION_OCAAN7KL7H3NBCG4MS5U32HK4I 1: ONE-TIME PASSWORD\",\"SECTION_HMDIBYQYZTOO3T7VHQNL6RWD5Q 1: ONE-TIME PASSWORD\",\"SECTION_HMDIBYQYZTOO3T7VHQNL6RWD5Q 2: TOTP EMEA\",\"SECTION_25UMUV5BFEIKPG3CIR7GJZDZ2Q 1: ONE-TIME PASSWORD\",\"SECTION_EKCTDUQ7IY3LEL5Z3W7V6WSRYY 1: ONE-TIME PASSWORD\",\"SECTION_PNMULQU23IIE3APZCB47HX7NYY 1: ONE-TIME PASSWORD\",\"SECTION_2YB726SMDTKVK5BS2LLJG3C3EU 1: ONE-TIME PASSWORD\",\"SECTION_7NYM44Q42TTUKZZ7XQV3KJZJT4 1: ONE-TIME PASSWORD\",\"SECTION_ARWON2SMNJJB3DGYAYUDSSZG7I 1: ONE-TIME PASSWORD\",\"SECTION_I3U3L7I7VK2LQVJR2XYU6QMK2Y 1: ONE-TIME PASSWORD\"\n" +
            "\"ujidqjyjh4joibs7n6fn5tidha\",\"[Customer A] Password Entry 1\",\"seroczynski@discord.com\",\"StrongPassword123\",\"Default\",\"Default\",\"Uses another website\n" +
            "\n" +
            "Environment: Test/Prod\n" +
            "\n" +
            "Also works on GitLab.\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\"\n" +
            "\"gnimeglnfrr6h4nvdvlzh63zba\",\"[Customer B] Password Entry 1\",\"seroczynski@discord.com\",\"AnotherStrongPassword123\",\"Default\",\"Default\",\"Note: authenticate with username, not email.\",\"https://discord.com/login\",\"https://psono.com/login\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\"\n" +
            "\"wuzqa7o4ovpeboo2npneobb254\",\"[Customer B] Password Entry 2\",\"seroczynski@discord.com\",\"AnEvenStrongerPassword123\",\"Default\",\"Default\",\"1) Secret Question Answer 1\n" +
            "2) Secret Question Answer 2\n" +
            "3) Secret Question Answer 3\",\"https://discord/login\",\"https://psono.com/login\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\"\n";


        const output = import1PasswordV7Csv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "items": [{
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "[Customer A] Password Entry 1",
                    "application_password_password": "StrongPassword123",
                    "application_password_username": "seroczynski@discord.com",
                    "application_password_notes": "Uses another website\n\nEnvironment: Test/Prod\n\nAlso works on GitLab.\nujidqjyjh4joibs7n6fn5tidha\nDefault\nDefault",
                    "application_password_title": "[Customer A] Password Entry 1"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "[Customer B] Password Entry 1",
                    "urlfilter": "discord.com",
                    "website_password_url_filter": "discord.com",
                    "website_password_password": "AnotherStrongPassword123",
                    "website_password_username": "seroczynski@discord.com",
                    "website_password_notes": "Note: authenticate with username, not email.\ngnimeglnfrr6h4nvdvlzh63zba\nDefault\nDefault",
                    "website_password_url": "https://discord.com/login",
                    "website_password_title": "[Customer B] Password Entry 1"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "[Customer B] Password Entry 2",
                    "urlfilter": "discord",
                    "website_password_url_filter": "discord",
                    "website_password_password": "AnEvenStrongerPassword123",
                    "website_password_username": "seroczynski@discord.com",
                    "website_password_notes": "1) Secret Question Answer 1\n2) Secret Question Answer 2\n3) Secret Question Answer 3\nwuzqa7o4ovpeboo2npneobb254\nDefault\nDefault",
                    "website_password_url": "https://discord/login",
                    "website_password_title": "[Customer B] Password Entry 2"
                }]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "application_password",
                "name": "[Customer A] Password Entry 1",
                "application_password_password": "StrongPassword123",
                "application_password_username": "seroczynski@discord.com",
                "application_password_notes": "Uses another website\n\nEnvironment: Test/Prod\n\nAlso works on GitLab.\nujidqjyjh4joibs7n6fn5tidha\nDefault\nDefault",
                "application_password_title": "[Customer A] Password Entry 1"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "[Customer B] Password Entry 1",
                "urlfilter": "discord.com",
                "website_password_url_filter": "discord.com",
                "website_password_password": "AnotherStrongPassword123",
                "website_password_username": "seroczynski@discord.com",
                "website_password_notes": "Note: authenticate with username, not email.\ngnimeglnfrr6h4nvdvlzh63zba\nDefault\nDefault",
                "website_password_url": "https://discord.com/login",
                "website_password_title": "[Customer B] Password Entry 1"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "[Customer B] Password Entry 2",
                "urlfilter": "discord",
                "website_password_url_filter": "discord",
                "website_password_password": "AnEvenStrongerPassword123",
                "website_password_username": "seroczynski@discord.com",
                "website_password_notes": "1) Secret Question Answer 1\n2) Secret Question Answer 2\n3) Secret Question Answer 3\nwuzqa7o4ovpeboo2npneobb254\nDefault\nDefault",
                "website_password_url": "https://discord/login",
                "website_password_title": "[Customer B] Password Entry 2"
            }]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});