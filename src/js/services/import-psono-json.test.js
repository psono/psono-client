import React from 'react';
import importPsonoJson from './import-psono-json';
import cryptoLibrary from "../services/crypto-library";
import {initStore} from "./store";


describe('Service: importPsonoJson test suite', function () {

    it('importPsonoJson exists', function () {
        expect(importPsonoJson).toBeDefined();
    });
    
    it('parse', async function () {

        await initStore()
        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = '{"folders":[{"name":"A Folder"},{"name":"Company Passwords","folders":[{"name":"bla","items":[{"type":"website_password","urlfilter":"facebook.com","name":"Facebook","website_password_url_filter":"facebook.com","website_password_auto_submit":true,"website_password_password":"mypassword","website_password_username":"myusername","website_password_url":"https://de-de.facebook.com/","website_password_title":"Facebook"}, {"type":"website_password","name":"Instagram","website_password_auto_submit":true,"website_password_password":"mypassword","website_password_username":"myusername","website_password_url":"https://de-de.instagram.com/","website_password_title":"Instagram"}]}]}],"items":[{"type":"website_password","urlfilter":"amazon.de","name":"Amazon.de","website_password_url_filter":"amazon.de","website_password_password":"mypw","website_password_username":"myuser","website_password_url":"https://www.amazon.de","website_password_title":"Amazon.de"},{"type":"note","name":"My secret note","note_notes":"Some nice secrets go in here!","note_title":"My secret note"}]}';

        const output = importPsonoJson.parser(input);

        const expected_output = {
            "datastore": {
                "folders": [{
                    "name": "A Folder",
                    "id": generic_uuid
                }, {
                    "name": "Company Passwords",
                    "folders": [{
                        "name": "bla",
                        "items": [{
                            "type": "website_password",
                            "urlfilter": "facebook.com",
                            "name": "Facebook",
                            "website_password_url_filter": "facebook.com",
                            "website_password_auto_submit": true,
                            "website_password_password": "mypassword",
                            "website_password_username": "myusername",
                            "website_password_url": "https://de-de.facebook.com/",
                            "website_password_title": "Facebook",
                            "id": generic_uuid
                        }, {
                            "type": "website_password",
                            "urlfilter": "de-de.instagram.com",
                            "name": "Instagram",
                            "website_password_url_filter": "de-de.instagram.com",
                            "website_password_auto_submit": true,
                            "website_password_password": "mypassword",
                            "website_password_username": "myusername",
                            "website_password_url": "https://de-de.instagram.com/",
                            "website_password_title": "Instagram",
                            "id": generic_uuid
                        }],
                        "id": generic_uuid
                    }],
                    "id": generic_uuid
                }],
                "items": [{
                    "type": "website_password",
                    "urlfilter": "amazon.de",
                    "name": "Amazon.de",
                    "website_password_url_filter": "amazon.de",
                    "website_password_password": "mypw",
                    "website_password_username": "myuser",
                    "website_password_url": "https://www.amazon.de",
                    "website_password_title": "Amazon.de",
                    "id": generic_uuid
                }, {
                    "type": "note",
                    "name": "My secret note",
                    "note_notes": "Some nice secrets go in here!",
                    "note_title": "My secret note",
                    "id": generic_uuid
                }],
                "name": output.datastore.name,
                "id": generic_uuid
            },
            "secrets": [{
                "type": "website_password",
                "urlfilter": "facebook.com",
                "name": "Facebook",
                "website_password_url_filter": "facebook.com",
                "website_password_auto_submit": true,
                "website_password_password": "mypassword",
                "website_password_username": "myusername",
                "website_password_url": "https://de-de.facebook.com/",
                "website_password_title": "Facebook",
                "id": generic_uuid
            }, {
                "type": "website_password",
                "urlfilter": "de-de.instagram.com",
                "name": "Instagram",
                "website_password_url_filter": "de-de.instagram.com",
                "website_password_auto_submit": true,
                "website_password_password": "mypassword",
                "website_password_username": "myusername",
                "website_password_url": "https://de-de.instagram.com/",
                "website_password_title": "Instagram",
                "id": generic_uuid
            }, {
                "type": "website_password",
                "urlfilter": "amazon.de",
                "name": "Amazon.de",
                "website_password_url_filter": "amazon.de",
                "website_password_password": "mypw",
                "website_password_username": "myuser",
                "website_password_url": "https://www.amazon.de",
                "website_password_title": "Amazon.de",
                "id": generic_uuid
            }, {
                "type": "note",
                "name": "My secret note",
                "note_notes": "Some nice secrets go in here!",
                "note_title": "My secret note",
                "id": generic_uuid
            }]
        };

        expect(output).toEqual(expected_output);
    });

});
