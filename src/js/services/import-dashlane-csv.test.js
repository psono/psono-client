import cryptoLibrary from "./crypto-library";
import importDashlaneCsv from './import-keepassxc-org-csv';

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
                id: generic_uuid,
                name: output.datastore.name,
                folders: [],
                items: [
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'service',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'v3rys3cur3',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'dontleakme',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: "this contains `,` so it's in quotes",
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: 'username',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: 'username'
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: '',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: 'use this instead of email',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: 'use this instead of email'
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: '',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: 'use me',
                        website_password_password: '',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: 'use me'
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: '',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: ''
                    },
                    {
                        id: generic_uuid,
                        type: 'website_password',
                        name: 'login name',
                        website_password_password: 'title',
                        website_password_username: '',
                        website_password_notes: '',
                        website_password_url: 'p4assw0rd',
                        website_password_title: 'login name'
                    }
                ]
            },
            "secrets": [
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'service',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'v3rys3cur3',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'dontleakme',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: "this contains `,` so it's in quotes",
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: 'username',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: 'username'
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: '',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: 'use this instead of email',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: 'use this instead of email'
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: '',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: 'use me',
                    website_password_password: '',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: 'use me'
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: '',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: ''
                },
                {
                    id: generic_uuid,
                    type: 'website_password',
                    name: 'login name',
                    website_password_password: 'title',
                    website_password_username: '',
                    website_password_notes: '',
                    website_password_url: 'p4assw0rd',
                    website_password_title: 'login name'
                }
            ]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});
