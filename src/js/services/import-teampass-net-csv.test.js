import React from 'react';
import importTeampassNetCsv from './import-teampass-net-csv';
import cryptoLibrary from "../services/crypto-library";

describe('Service: importTeampassNetCsv test suite', function () {

    it('importTeampassNetCsv exists', function () {
        expect(importTeampassNetCsv).toBeDefined();
    });
    
    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);
        
        var input = "\"Project name\",\"Name\",\"Access information\",\"Username\",\"E-mail\",\"Password\",\"Notes\",\"Tags\",\"Custom fields\",\"Custom 1\",\"Custom 2\",\"Custom 4\",\"Custom 5\",\"Custom 6\",\"Custom 7\",\"Custom 8\",\"Custom 9\",\"Custom 10\",\"Expiry date (mm-dd-yyyy)\"\n" +
            "\"Software\",\"Database user\",\"http://192.168.0.34/phpma\",\"john\",\"john@company.com\",\"doe\",\"\",\"db,mydb\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"10-01-2014\"\n" +
            "\"Software\",\"Server admin\",\"192.168.0.34\",\"admin\",\"\",\"test\",\"sample notes\",\"tag1,tag2\",\"custom1,custom2\",\"custom value 1\",\"custom value 2\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\"\n" +
            "\"Hardware\",\"Router\",\"192.168.0.1\",\"admin\",\"\",\"easypwd\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"10-30-2015\"\n" +
            "\"Hardware\",\"Server room code\",\"\",\"\",\"\",\"1234\",\"\",\"pin\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\""
        

        var output = importTeampassNetCsv.parser(input);

        var expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "items": [],
                "folders": [{
                    "id": generic_uuid,
                    "name": "Software",
                    "folders": [],
                    "items": [{
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "Database user (db,mydb)",
                        "urlfilter": "192.168.0.34",
                        "website_password_url_filter": "192.168.0.34",
                        "website_password_password": "doe",
                        "website_password_username": "john",
                        "website_password_notes": "\nEmail: john@company.com\n",
                        "website_password_url": "http://192.168.0.34/phpma",
                        "website_password_title": "Database user (db,mydb)"
                    }, {
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "Server admin (tag1,tag2)",
                        "website_password_password": "test",
                        "website_password_username": "admin",
                        "website_password_notes": "sample notes\ncustom1: custom value 1\ncustom2: custom value 2\n",
                        "website_password_url": "192.168.0.34",
                        "website_password_title": "Server admin (tag1,tag2)"
                    }
                    ]
                }, {
                    "id": generic_uuid,
                    "name": "Hardware",
                    "folders": [],
                    "items": [{
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "Router",
                        "website_password_password": "easypwd",
                        "website_password_username": "admin",
                        "website_password_notes": "\n",
                        "website_password_url": "192.168.0.1",
                        "website_password_title": "Router"
                    }, {
                        "id": generic_uuid,
                        "type": "application_password",
                        "name": "Server room code (pin)",
                        "application_password_password": "1234",
                        "application_password_username": "",
                        "application_password_notes": "\n",
                        "application_password_title": "Server room code (pin)"
                    }
                    ]
                }
                ]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "website_password",
                "name": "Database user (db,mydb)",
                "urlfilter": "192.168.0.34",
                "website_password_url_filter": "192.168.0.34",
                "website_password_password": "doe",
                "website_password_username": "john",
                "website_password_notes": "\nEmail: john@company.com\n",
                "website_password_url": "http://192.168.0.34/phpma",
                "website_password_title": "Database user (db,mydb)"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Server admin (tag1,tag2)",
                "website_password_password": "test",
                "website_password_username": "admin",
                "website_password_notes": "sample notes\ncustom1: custom value 1\ncustom2: custom value 2\n",
                "website_password_url": "192.168.0.34",
                "website_password_title": "Server admin (tag1,tag2)"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Router",
                "website_password_password": "easypwd",
                "website_password_username": "admin",
                "website_password_notes": "\n",
                "website_password_url": "192.168.0.1",
                "website_password_title": "Router"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Server room code (pin)",
                "application_password_password": "1234",
                "application_password_username": "",
                "application_password_notes": "\n",
                "application_password_title": "Server room code (pin)"
            }
            ]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});

