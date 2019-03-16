import requests
import shutil
import os

POEDITOR_API_KEY = os.environ['POEDITOR_API_KEY']
POEDITOR_PROJECT_ID = os.environ['POEDITOR_PROJECT_ID']
ARTIFACTORY_URL = os.environ.get('ARTIFACTORY_URL', 'https://psono.jfrog.io/psono')
ARTIFACTORY_PATH = os.environ.get('ARTIFACTORY_PATH', '/psono/client/languages/')
ARTIFACTORY_USER = os.environ.get('ARTIFACTORY_USER', 'gitlab')
ARTIFACTORY_PASS = os.environ['ARTIFACTORY_PASS']


LANGUAGE_CODES = [
    "af", "sq", "ar-sa", "ar-iq", "ar-eg", "ar-ly", "ar-dz", "ar-ma", "ar-tn", "ar-om",
    "ar-ye", "ar-sy", "ar-jo", "ar-lb", "ar-kw", "ar-ae", "ar-bh", "ar-qa", "eu", "bg",
    "be", "ca", "zh-tw", "zh-cn", "zh-hk", "zh-sg", "hr", "cs", "da", "nl", "nl-be", "en",
    "en-us", "en-eg", "en-au", "en-gb", "en-ca", "en-nz", "en-ie", "en-za", "en-jm",
    "en-bz", "en-tt", "et", "fo", "fa", "fi", "fr", "fr-be", "fr-ca", "fr-ch", "fr-lu",
    "gd", "gd-ie", "de", "de-ch", "de-at", "de-lu", "de-li", "el", "he", "hi", "hu",
    "is", "id", "it", "it-ch", "ja", "ko", "lv", "lt", "mk", "mt", "no", "pl",
    "pt-br", "pt", "rm", "ro", "ro-mo", "ru", "ru-mi", "sz", "sr", "sk", "sl", "sb",
    "es", "es-ar", "es-gt", "es-cr", "es-pa", "es-do", "es-mx", "es-ve", "es-co",
    "es-pe", "es-ec", "es-cl", "es-uy", "es-py", "es-bo", "es-sv", "es-hn", "es-ni",
    "es-pr", "sx", "sv", "sv-fi", "th", "ts", "tn", "tr", "uk", "ur", "ve", "vi", "xh",
    "ji", "zu"
]

WEBHOOKS = {
    'cs': 'https://api.poeditor.com/webhooks/6f9ccaf590',
    'de': 'https://api.poeditor.com/webhooks/cc03403af4',
    'en': 'https://api.poeditor.com/webhooks/0f5aeab8bc',
    'es': 'https://api.poeditor.com/webhooks/ab77f8945a',
    'fi': 'https://api.poeditor.com/webhooks/b8096339f3',
    'fr': 'https://api.poeditor.com/webhooks/54848feabf',
    'hr': 'https://api.poeditor.com/webhooks/08749311d2',
    'it': 'https://api.poeditor.com/webhooks/c935515d00',
    'ja': 'https://api.poeditor.com/webhooks/333879768e',
    'ko': 'https://api.poeditor.com/webhooks/f9b7e46774',
    'nl': 'https://api.poeditor.com/webhooks/e9759d447d',
    'pl': 'https://api.poeditor.com/webhooks/c509027422',
    'ru': 'https://api.poeditor.com/webhooks/9230be9768',
    'vi': 'https://api.poeditor.com/webhooks/ae0b49bd93',
    'zh-cn': 'https://api.poeditor.com/webhooks/22ed2bb261',
}


def upload_language(lang):

    if lang in WEBHOOKS:
        params = (
            ('api_token', POEDITOR_API_KEY),
            ('id_project', POEDITOR_PROJECT_ID),
        )

        r = requests.post(WEBHOOKS[lang], params=params)
    else:
        print("Error: upload_language " + lang + " No webhook configured for this language")
    #     params = (
    #         ('api_token', POEDITOR_API_KEY),
    #         ('id_project', POEDITOR_PROJECT_ID),
    #         ('language', lang),
    #         ('operation', 'import_terms_and_translations'),
    #     )
    #
    #     r = requests.post('https://poeditor.com/api/webhooks/gitlab', params=params)
    if not r.ok or r.text != 'Request received':
        print("Error: upload_language " + lang)
        print(r.text)
        exit(1)
    print("Success: upload_language " + lang)

def download_language(lang):
    data = [
        ('api_token', POEDITOR_API_KEY),
        ('action', 'export'),
        ('id', POEDITOR_PROJECT_ID),
        ('language', lang),
        ('type', 'key_value_json'),
    ]

    r = requests.post('https://poeditor.com/api/', data=data)

    if not r.ok:
        print("Error: download_language")
        print(r.text)
        exit(1)

    result = r.json()

    r = requests.get(result['item'], stream=True)

    path = 'locale-'+lang+'.json'

    if r.status_code == 200:
        with open(path, 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)

    print("Success: download_language " + lang)

    return path

def deploy_to_artifactory(artifactory_user, artifactory_pass, artifactory_url, path, lang, file):
    with open(file, 'rb') as f:
        r = requests.put(artifactory_url + path  + file,
                         data=f,
                         auth=(artifactory_user, artifactory_pass))
    if not r.ok:
        print("Error: get_languages")
        print(r.json())
        exit(1)
    result = r.json()
    print("Success: deploy_to_artifactory " + lang)

def get_languages():
    data = [
      ('api_token', POEDITOR_API_KEY),
      ('id', POEDITOR_PROJECT_ID),
    ]

    r = requests.post('https://api.poeditor.com/v2/languages/list', data=data)
    if not r.ok:
        print("Error: get_languages")
        print(r.json())
        exit(1)
    result = r.json()
    print(result['result']['languages'])
    return result['result']['languages']



def main():
    languages = get_languages()
    for lang in languages:
        language_code = lang['code'].lower()
        if language_code not in LANGUAGE_CODES:
            print("Error: main")
            print("Invalid Language Code " + language_code)
            exit(1)
        upload_language(language_code)
        file = download_language(language_code)
        deploy_to_artifactory(ARTIFACTORY_USER, ARTIFACTORY_PASS, ARTIFACTORY_URL, ARTIFACTORY_PATH, language_code, file)

    print("Success")

if __name__ == "__main__":
    main()