import requests
import os
import json
import time

POEDITOR_API_KEY = os.environ['POEDITOR_API_KEY']
POEDITOR_PROJECT_ID = os.environ['POEDITOR_PROJECT_ID']


FILE_PATHS = {
    'en': 'src/common/data/translations/locale-en.json',
}


def upload_language(lang, updating):

    if lang in FILE_PATHS:
        data = {
            'id': POEDITOR_PROJECT_ID,
            'api_token': POEDITOR_API_KEY,
            'updating': updating,
            'language': lang,
            'overwrite': 1,
            'sync_terms ': 1,
        }
        with open(FILE_PATHS[lang], 'rb') as file:
            r = requests.post('https://api.poeditor.com/v2/projects/upload', data=data, files={'file': file})

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
    if not r.ok:
        print("Error: upload_language " + lang)
        print(r.text)
        exit(1)
    content = json.loads(r.content)
    if "response" not in content or "status" not in content["response"] or content["response"]["status"] != 'success':
        print("Error: upload_language " + lang)
        print(r.text)
        exit(1)
    print("Success: upload_language " + lang)


def main():
    # Upload
    upload_language('en', 'terms_translations')

    print("Success")

if __name__ == "__main__":
    main()
