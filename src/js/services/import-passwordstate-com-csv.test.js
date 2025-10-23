import cryptoLibrary from "./crypto-library";
import importPasswordstateComCsv from './import-passwordstate-com-csv';

describe('Service: importPasswordstateComCsv test suite', function () {

    it('importPasswordstateComCsv exists', function () {
        expect(importPasswordstateComCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "PasswordListID,Password List,TreePath,PasswordID,Title,DomainOrHost,UserName,Description,Account Type,Notes,URL,Password,ExpiryDate,OTPUri,Licence Key,Generic Field 2,Generic Field 3,Generic Field 4,Generic Field 5,Generic Field 6,Generic Field 7,Generic Field 8,Generic Field 9,Generic Field 10,WebUser_ID,WebPassword_ID,WebOTP_ID,WebGenericField1_ID,WebGenericField2_ID,WebGenericField3_ID,WebGenericField4_ID,WebGenericField5_ID,WebGenericField6_ID,WebGenericField7_ID,WebGenericField8_ID,WebGenericField9_ID,WebGenericField10_ID\n" +
            "97,Folder-Name12,\\System-Integration (DEVOPS)\\External-Servers\\Wood,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "PasswordListID,Password List,TreePath,PasswordID,Title,DomainOrHost,UserName,Description,Account Type,Notes,URL,Password,ExpiryDate,OTPUri,Licence Key,Generic Field 2,Generic Field 3,Generic Field 4,Generic Field 5,Generic Field 6,Generic Field 7,Generic Field 8,Generic Field 9,Generic Field 10,WebUser_ID,WebPassword_ID,WebOTP_ID,WebGenericField1_ID,WebGenericField2_ID,WebGenericField3_ID,WebGenericField4_ID,WebGenericField5_ID,WebGenericField6_ID,WebGenericField7_ID,WebGenericField8_ID,WebGenericField9_ID,WebGenericField10_ID\n" +
            "3662,Folder-Name59,\\System-Integration (DEVOPS)\\External-Servers\\Oel,10790,Max Muster,,username,,Linux,internal server,https://www.google.com,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3662,Folder-Name59,\\System-Integration (DEVOPS)\\External-Servers\\Oel,10812,Example title user2 (deployment user),,External-user,,Linux,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3662,Folder-Name59,\\System-Integration (DEVOPS)\\External-Servers\\Oel,10807,Example title user (deployment user),,root,,MariaDB,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3662,Folder-Name59,\\System-Integration (DEVOPS)\\External-Servers\\Oel,10828,MariaDB - root,,superuser,,MariaDB,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "PasswordListID,Password List,TreePath,PasswordID,Title,DomainOrHost,UserName,Description,Account Type,Notes,URL,Password,ExpiryDate,OTPUri,Licence Key,Generic Field 2,Generic Field 3,Generic Field 4,Generic Field 5,Generic Field 6,Generic Field 7,Generic Field 8,Generic Field 9,Generic Field 10,WebUser_ID,WebPassword_ID,WebOTP_ID,WebGenericField1_ID,WebGenericField2_ID,WebGenericField3_ID,WebGenericField4_ID,WebGenericField5_ID,WebGenericField6_ID,WebGenericField7_ID,WebGenericField8_ID,WebGenericField9_ID,WebGenericField10_ID\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10818,Max Muster,,username,,Linux,Very nice user,https://www.google.com,mypassword,,,0d5d54-EA0D-4C70-46B1-B1E3-47AC-4E4F-138E-1DE-0639-B0D5-7EC4-DCC0-DDE4-680F-2504,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10834,Example title user2 (deployment user),,External-user,,Linux,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10833,Example title user (deployment user),,root,,Linux,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10829,MariaDB - root,,superuser,,MariaDB,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10830,MariaDB – user,,dummy,,MariaDB,,,mypassword,,,,,,,,,,,,,,,,,,,,,,,,,\n" +
            "3664,Folder-Name1,\\System-Integration (DEVOPS)\\External-Servers\\customer,10831,DB user ,,superuser2,,Windows,,,mypassword,,otpauth://totp/DigiCert:admin@example.com?secret=5d5d5d5d5d5,,,,,,,,,,,,,,,,,,,,,,,\n";

        const output = importPasswordstateComCsv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "folders": [{
                    "id": generic_uuid,
                    "name": "System-Integration (DEVOPS)",
                    "folders": [{
                        "id": generic_uuid,
                        "name": "External-Servers",
                        "folders": [{
                            "id": generic_uuid,
                            "name": "Oel",
                            "folders": [{
                                "id": generic_uuid,
                                "name": "Folder-Name59",
                                "items": [{
                                    "id": generic_uuid,
                                    "type": "website_password",
                                    "name": "Max Muster",
                                    "description": "username",
                                    "urlfilter": "www.google.com",
                                    "website_password_url_filter": "www.google.com",
                                    "website_password_password": "mypassword",
                                    "website_password_username": "username",
                                    "website_password_notes": "internal server",
                                    "website_password_url": "https://www.google.com",
                                    "website_password_title": "Max Muster"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "Example title user2 (deployment user)",
                                    "description": "External-user",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "External-user",
                                    "application_password_notes": "",
                                    "application_password_title": "Example title user2 (deployment user)"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "Example title user (deployment user)",
                                    "description": "root",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "root",
                                    "application_password_notes": "",
                                    "application_password_title": "Example title user (deployment user)"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "MariaDB - root",
                                    "description": "superuser",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "superuser",
                                    "application_password_notes": "",
                                    "application_password_title": "MariaDB - root"
                                }]
                            }],
                            "items": []
                        }, {
                            "id": generic_uuid,
                            "name": "customer",
                            "folders": [{
                                "id": generic_uuid,
                                "name": "Folder-Name1",
                                "items": [{
                                    "id": generic_uuid,
                                    "type": "website_password",
                                    "name": "Max Muster",
                                    "description": "username",
                                    "urlfilter": "www.google.com",
                                    "website_password_url_filter": "www.google.com",
                                    "website_password_password": "mypassword",
                                    "website_password_username": "username",
                                    "website_password_notes": "Very nice user\n\nLicense Key: 0d5d54-EA0D-4C70-46B1-B1E3-47AC-4E4F-138E-1DE-0639-B0D5-7EC4-DCC0-DDE4-680F-2504",
                                    "website_password_url": "https://www.google.com",
                                    "website_password_title": "Max Muster"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "Example title user2 (deployment user)",
                                    "description": "External-user",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "External-user",
                                    "application_password_notes": "",
                                    "application_password_title": "Example title user2 (deployment user)"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "Example title user (deployment user)",
                                    "description": "root",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "root",
                                    "application_password_notes": "",
                                    "application_password_title": "Example title user (deployment user)"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "MariaDB - root",
                                    "description": "superuser",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "superuser",
                                    "application_password_notes": "",
                                    "application_password_title": "MariaDB - root"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "MariaDB – user",
                                    "description": "dummy",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "dummy",
                                    "application_password_notes": "",
                                    "application_password_title": "MariaDB – user"
                                }, {
                                    "id": generic_uuid,
                                    "type": "application_password",
                                    "name": "DB user ",
                                    "description": "superuser2",
                                    "application_password_password": "mypassword",
                                    "application_password_username": "superuser2",
                                    "application_password_notes": "",
                                    "application_password_title": "DB user "
                                }, {
                                    "id": generic_uuid,
                                    "type": "totp",
                                    "name": "DB user  TOTP",
                                    "totp_notes": "",
                                    "totp_code": "5D5D5D5D5A",
                                    "totp_digits": 6,
                                    "totp_algorithm": "SHA1",
                                    "totp_period": 30,
                                    "totp_title": "DB user  TOTP"
                                }]
                            }],
                            "items": []
                        }],
                        "items": []
                    }],
                    "items": []
                }]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "website_password",
                "name": "Max Muster",
                "description": "username",
                "urlfilter": "www.google.com",
                "website_password_url_filter": "www.google.com",
                "website_password_password": "mypassword",
                "website_password_username": "username",
                "website_password_notes": "internal server",
                "website_password_url": "https://www.google.com",
                "website_password_title": "Max Muster"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Example title user2 (deployment user)",
                "description": "External-user",
                "application_password_password": "mypassword",
                "application_password_username": "External-user",
                "application_password_notes": "",
                "application_password_title": "Example title user2 (deployment user)"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Example title user (deployment user)",
                "description": "root",
                "application_password_password": "mypassword",
                "application_password_username": "root",
                "application_password_notes": "",
                "application_password_title": "Example title user (deployment user)"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "MariaDB - root",
                "description": "superuser",
                "application_password_password": "mypassword",
                "application_password_username": "superuser",
                "application_password_notes": "",
                "application_password_title": "MariaDB - root"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Max Muster",
                "description": "username",
                "urlfilter": "www.google.com",
                "website_password_url_filter": "www.google.com",
                "website_password_password": "mypassword",
                "website_password_username": "username",
                "website_password_notes": "Very nice user\n\nLicense Key: 0d5d54-EA0D-4C70-46B1-B1E3-47AC-4E4F-138E-1DE-0639-B0D5-7EC4-DCC0-DDE4-680F-2504",
                "website_password_url": "https://www.google.com",
                "website_password_title": "Max Muster"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Example title user2 (deployment user)",
                "description": "External-user",
                "application_password_password": "mypassword",
                "application_password_username": "External-user",
                "application_password_notes": "",
                "application_password_title": "Example title user2 (deployment user)"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Example title user (deployment user)",
                "description": "root",
                "application_password_password": "mypassword",
                "application_password_username": "root",
                "application_password_notes": "",
                "application_password_title": "Example title user (deployment user)"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "MariaDB - root",
                "description": "superuser",
                "application_password_password": "mypassword",
                "application_password_username": "superuser",
                "application_password_notes": "",
                "application_password_title": "MariaDB - root"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "MariaDB – user",
                "description": "dummy",
                "application_password_password": "mypassword",
                "application_password_username": "dummy",
                "application_password_notes": "",
                "application_password_title": "MariaDB – user"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "DB user ",
                "description": "superuser2",
                "application_password_password": "mypassword",
                "application_password_username": "superuser2",
                "application_password_notes": "",
                "application_password_title": "DB user "
            }, {
                "id": generic_uuid,
                "type": "totp",
                "name": "DB user  TOTP",
                "totp_notes": "",
                "totp_code": "5D5D5D5D5A",
                "totp_digits": 6,
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "DB user  TOTP"
            }]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});
