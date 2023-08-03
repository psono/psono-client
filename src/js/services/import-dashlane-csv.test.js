import cryptoLibrary from "./crypto-library";
import importDashlaneCsv from './import-dashlane-csv';

describe('Service: importDashlaneCsv test suite', function () {

    it('importDashlaneCsv exists', function () {
        expect(importDashlaneCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "username,username2,username3,title,password,note,url,category,otpSecret\n" +
            "email@example.com,,,service,p4assw0rd,,,,\n" +
            "email@example.com,,,title,v3rys3cur3,,title.com,,\n" +
            "justausername,,,title,dontleakme,,title.com,,\n" +
            "email@example.com,,,title,\"this contains `,` so it's in quotes\",,https://www.title.com/accounts/edit,Geschäftlich,\n" +
            ",username,,title,p4assw0rd,,https://title.com/account/register,,\n" +
            "email@example.com,,,,p4assw0rd,,https://title.com/us/,Shopping,\n" +
            "email@example.com,use this instead of email,,title,p4assw0rd,,https://title.com/key/,Unterhaltung,\n" +
            "email@example.com,,,title,p4assw0rd,,https://title.com/,,\n" +
            "justausername,,,title,p4assw0rd,,https://www.title.com/html/myAccount/login/page.html,Shopping,\n" +
            ",,,,p4assw0rd,,https://account.title.com/login/oauth2/enter-password,,\n" +
            "email@example.com,,,title,p4assw0rd,,https://git.title.com/-/profile/password/edit,,\n" +
            "justausername,,,title,p4assw0rd,,title,,\n" +
            "email@example.com,use me,,,p4assw0rd,,https://www.title.com/v3/register/main.page,Unterhaltung,\n" +
            "email@example.com,,,title,p4assw0rd,,https://www.title.com/checkout/shippingPayment,,\n" +
            "email@example.com,login name,,title,p4assw0rd,,https://title.com,,"

        const output = importDashlaneCsv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "folders": [
                    {
                        "id": generic_uuid,
                        "name": "Undefined",
                        "items": [
                            {
                                "id": generic_uuid,
                                "type": "application_password",
                                "name": "service",
                                "application_password_password": "p4assw0rd",
                                "application_password_username": "email@example.com",
                                "application_password_notes": "",
                                "application_password_title": "service"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "v3rys3cur3",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "dontleakme",
                                "website_password_username": "justausername",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "username",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com/account/register",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com/",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "https://account.title.com/login/oauth2/enter-password",
                                "urlfilter": "account.title.com",
                                "website_password_url_filter": "account.title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "",
                                "website_password_notes": "",
                                "website_password_url": "https://account.title.com/login/oauth2/enter-password",
                                "website_password_title": "https://account.title.com/login/oauth2/enter-password"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "git.title.com",
                                "website_password_url_filter": "git.title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://git.title.com/-/profile/password/edit",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title",
                                "website_password_url_filter": "title",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "justausername",
                                "website_password_notes": "",
                                "website_password_url": "https://title",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "www.title.com",
                                "website_password_url_filter": "www.title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://www.title.com/checkout/shippingPayment",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "login name",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com",
                                "website_password_title": "title"
                            }
                        ]
                    },
                    {
                        "id": generic_uuid,
                        "name": "Geschäftlich",
                        "items": [
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "www.title.com",
                                "website_password_url_filter": "www.title.com",
                                "website_password_password": "this contains `,` so it's in quotes",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://www.title.com/accounts/edit",
                                "website_password_title": "title"
                            }
                        ]
                    },
                    {
                        "id": generic_uuid,
                        "name": "Shopping",
                        "items": [
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "https://title.com/us/",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "email@example.com",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com/us/",
                                "website_password_title": "https://title.com/us/"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "www.title.com",
                                "website_password_url_filter": "www.title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "justausername",
                                "website_password_notes": "",
                                "website_password_url": "https://www.title.com/html/myAccount/login/page.html",
                                "website_password_title": "title"
                            }
                        ]
                    },
                    {
                        "id": generic_uuid,
                        "name": "Unterhaltung",
                        "items": [
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "title",
                                "urlfilter": "title.com",
                                "website_password_url_filter": "title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "use this instead of email",
                                "website_password_notes": "",
                                "website_password_url": "https://title.com/key/",
                                "website_password_title": "title"
                            },
                            {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "https://www.title.com/v3/register/main.page",
                                "urlfilter": "www.title.com",
                                "website_password_url_filter": "www.title.com",
                                "website_password_password": "p4assw0rd",
                                "website_password_username": "use me",
                                "website_password_notes": "",
                                "website_password_url": "https://www.title.com/v3/register/main.page",
                                "website_password_title": "https://www.title.com/v3/register/main.page"
                            }
                        ]
                    }
                ]
            },
            "secrets": [
                {
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "service",
                    "application_password_password": "p4assw0rd",
                    "application_password_username": "email@example.com",
                    "application_password_notes": "",
                    "application_password_title": "service"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "v3rys3cur3",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "dontleakme",
                    "website_password_username": "justausername",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "www.title.com",
                    "website_password_url_filter": "www.title.com",
                    "website_password_password": "this contains `,` so it's in quotes",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://www.title.com/accounts/edit",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "username",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com/account/register",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "https://title.com/us/",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com/us/",
                    "website_password_title": "https://title.com/us/"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "use this instead of email",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com/key/",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com/",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "www.title.com",
                    "website_password_url_filter": "www.title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "justausername",
                    "website_password_notes": "",
                    "website_password_url": "https://www.title.com/html/myAccount/login/page.html",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "https://account.title.com/login/oauth2/enter-password",
                    "urlfilter": "account.title.com",
                    "website_password_url_filter": "account.title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "",
                    "website_password_notes": "",
                    "website_password_url": "https://account.title.com/login/oauth2/enter-password",
                    "website_password_title": "https://account.title.com/login/oauth2/enter-password"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "git.title.com",
                    "website_password_url_filter": "git.title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://git.title.com/-/profile/password/edit",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title",
                    "website_password_url_filter": "title",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "justausername",
                    "website_password_notes": "",
                    "website_password_url": "https://title",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "https://www.title.com/v3/register/main.page",
                    "urlfilter": "www.title.com",
                    "website_password_url_filter": "www.title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "use me",
                    "website_password_notes": "",
                    "website_password_url": "https://www.title.com/v3/register/main.page",
                    "website_password_title": "https://www.title.com/v3/register/main.page"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "www.title.com",
                    "website_password_url_filter": "www.title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "email@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://www.title.com/checkout/shippingPayment",
                    "website_password_title": "title"
                },
                {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "title",
                    "urlfilter": "title.com",
                    "website_password_url_filter": "title.com",
                    "website_password_password": "p4assw0rd",
                    "website_password_username": "login name",
                    "website_password_notes": "",
                    "website_password_url": "https://title.com",
                    "website_password_title": "title"
                }
            ]
        };
        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});
