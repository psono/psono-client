import json
import os
import shutil

import requests


POEDITOR_API_KEY = os.environ.get('POEDITOR_API_KEY_READ_ONLY') or os.environ.get('POEDITOR_API_KEY')
POEDITOR_PROJECT_ID = os.environ['POEDITOR_PROJECT_ID']

TRANSLATION_DIR = 'src/common/data/translations'
LANGUAGE_CODES = [
    'ar',
    'bn',
    'ca',
    'cs',
    'da',
    'de',
    'en',
    'es',
    'fi',
    'fr',
    'he',
    'hi',
    'hr',
    'hu',
    'it',
    'ja',
    'ko',
    'nl',
    'no',
    'pl',
    'pt',
    'pt-BR',
    'ru',
    'sk',
    'sv',
    'uk',
    'vi',
    'zh-Hans',
    'zh-Hant',
]

POEDITOR_LANGUAGE_CODES = {
    'pt-BR': 'pt-br',
}


def get_poeditor_language_code(lang):
    return POEDITOR_LANGUAGE_CODES.get(lang, lang)


def download_language(lang):
    poeditor_lang = get_poeditor_language_code(lang)
    data = [
        ('api_token', POEDITOR_API_KEY),
        ('action', 'export'),
        ('id', POEDITOR_PROJECT_ID),
        ('language', poeditor_lang),
        ('type', 'key_value_json'),
    ]

    r = requests.post('https://poeditor.com/api/', data=data, timeout=20.0)
    if not r.ok:
        print('Error: download_language ' + lang)
        print(r.text)
        exit(1)

    result = r.json()
    if 'item' not in result:
        print('Error: download_language ' + lang)
        print(result)
        exit(1)

    r = requests.get(result['item'], stream=True, timeout=20.0)
    if r.status_code != 200:
        print('Error: download_language ' + lang)
        print(r.text)
        exit(1)

    path = os.path.join(TRANSLATION_DIR, 'locale-' + lang + '.json')
    tmp_path = path + '.tmp'
    with open(tmp_path, 'wb') as file:
        r.raw.decode_content = True
        shutil.copyfileobj(r.raw, file)

    with open(tmp_path, 'r', encoding='utf-8') as file:
        json.load(file)

    os.replace(tmp_path, path)
    print('Success: download_language ' + lang)


def main():
    if not POEDITOR_API_KEY:
        print('Error: POEDITOR_API_KEY_READ_ONLY or POEDITOR_API_KEY is required')
        exit(1)

    os.makedirs(TRANSLATION_DIR, exist_ok=True)
    for lang in LANGUAGE_CODES:
        download_language(lang)

    print('Success')


if __name__ == '__main__':
    main()
