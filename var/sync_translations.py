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
    "af", "sq", "ar_SA", "ar_IQ", "ar_EG", "ar_LY", "ar_DZ", "ar_MA", "ar_TN", "ar_OM",
    "ar_YE", "ar_SY", "ar_JO", "ar_LB", "ar_KW", "ar_AE", "ar_BH", "ar_QA", "eu", "bg",
    "be", "ca", "zh_TW", "zh_CN", "zh_HK", "zh_SG", "hr", "cs", "da", "nl", "nl_BE", "en",
    "en_US", "en_EG", "en_AU", "en_GB", "en_CA", "en_NZ", "en_IE", "en_ZA", "en_JM",
    "en_BZ", "en_TT", "et", "fo", "fa", "fi", "fr", "fr_BE", "fr_CA", "fr_CH", "fr_LU",
    "gd", "gd_IE", "de", "de_CH", "de_AT", "de_LU", "de_LI", "el", "he", "hi", "hu",
    "is", "id", "it", "it_CH", "ja", "ko", "lv", "lt", "mk", "mt", "no", "pl",
    "pt_BR", "pt", "rm", "ro", "ro_MO", "ru", "ru_MI", "sz", "sr", "sk", "sl", "sb",
    "es", "es_AR", "es_GT", "es_CR", "es_PA", "es_DO", "es_MX", "es_VE", "es_CO",
    "es_PE", "es_EC", "es_CL", "es_UY", "es_PY", "es_BO", "es_SV", "es_HN", "es_NI",
    "es_PR", "sx", "sv", "sv_FI", "th", "ts", "tn", "tr", "uk", "ur", "ve", "vi", "xh",
    "ji", "zu"
]


def upload_language(lang):

    params = (
        ('api_token', POEDITOR_API_KEY),
        ('id_project', POEDITOR_PROJECT_ID),
        ('language', lang),
        ('operation', 'import_terms_and_translations'),
    )

    r = requests.post('https://poeditor.com/api/webhooks/gitlab', params=params)
    if not r.ok or r.text != 'Request received':
        print("Error: upload_language")
        print(r.json())
        exit(1)

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
        print(r.json())
        exit(1)

    result = r.json()

    r = requests.get(result['item'], stream=True)

    path = 'locale-'+lang+'.json'

    if r.status_code == 200:
        with open(path, 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)

    return path

def deploy_to_artifactory(artifactory_user, artifactory_pass, artifactory_url, path, file):
    with open(file, 'rb') as f:
        r = requests.put(artifactory_url + path  + file,
                         data=f,
                         auth=(artifactory_user, artifactory_pass))
    if not r.ok:
        print("Error: get_languages")
        print(r.json())
        exit(1)
    result = r.json()
    print(result)

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
    return result['result']['languages']



def main():
    languages = get_languages()
    for lang in languages:
        if lang['code'] not in LANGUAGE_CODES:
            print("Error: main")
            print("Invalid Language Code " + lang['code'])
            exit(1)
        upload_language(lang['code'])
        file = download_language(lang['code'])
        deploy_to_artifactory(ARTIFACTORY_USER, ARTIFACTORY_PASS, ARTIFACTORY_URL, ARTIFACTORY_PATH, file)

    print("Success")

if __name__ == "__main__":
    main()