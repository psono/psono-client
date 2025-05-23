import os
import requests
import json

def main():
    EDGE_PRODUCT_ID = os.environ.get('EDGE_PRODUCT_ID')
    EDGE_CLIENT_ID = os.environ.get('EDGE_CLIENT_ID')
    EDGE_API_KEY = os.environ.get('EDGE_API_KEY')
    EDGE_NOTES = os.environ.get('EDGE_NOTES')

    REQUEST_TIMEOUT = 180

    if not all([EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_API_KEY]):
        print("Error: Missing one or more required environment variables.")
        print("Please ensure EDGE_PRODUCT_ID, EDGE_CLIENT_ID, and EDGE_API_KEY are set.")
        exit(1)

    BASE_ADDONS_API_URL = "https://api.addons.microsoftedge.microsoft.com/v1/products"

    headers = {
        "Authorization": f"ApiKey {EDGE_API_KEY}",
        "X-ClientID": EDGE_CLIENT_ID
    }

    operation_id = None

    print("\n--- Starting Extension Upload ---")
    upload_url = f"{BASE_ADDONS_API_URL}/{EDGE_PRODUCT_ID}/submissions/draft/package"
    file_path = "edge-extension.zip"

    if not os.path.exists(file_path):
        print(f"Error: Extension zip file not found at '{file_path}'.")
        print("Please ensure 'edge-extension.zip' exists in the same directory as the script, or update the 'file_path'.")
        exit(1)

    try:
        print(f"Attempting to upload '{file_path}' to: {upload_url}")

        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'application/zip')}

            params = {}
            if EDGE_NOTES:
                params['notes'] = EDGE_NOTES
                print(f"Including notes as query parameter: '{EDGE_NOTES}'")

            response = requests.post(
                upload_url,
                headers=headers,
                files=files,
                params=params,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()

            upload_result = response.json()
            operation_id = upload_result.get('operationId')

            if operation_id:
                print(f"Extension upload successful! Operation ID: {operation_id}")
            else:
                print("Error: 'operationId' not found in the upload response.")
                print("Full response:", json.dumps(upload_result, indent=2))

    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error during upload: {e}")
        print(f"Response status code: {e.response.status_code}")
        try:
            print("Response body:", json.dumps(e.response.json(), indent=2))
        except json.JSONDecodeError:
            print("Response body (non-JSON):", e.response.text)
        exit(1)
    except requests.exceptions.ConnectionError as e:
        print(f"Connection Error during upload: {e}")
        print("Please check your internet connection or the API endpoint.")
        exit(1)
    except requests.exceptions.Timeout as e:
        print(f"Timeout Error during upload: {e}")
        print(f"The request timed out after {REQUEST_TIMEOUT} seconds.")
        exit(1)
    except requests.exceptions.RequestException as e:
        print(f"An unexpected error occurred during upload: {e}")
        exit(1)

    if operation_id:
        print("\n--- Checking Publish Status ---")
        status_url = f"{BASE_ADDONS_API_URL}/{EDGE_PRODUCT_ID}/submissions/{operation_id}/publish"
        print(f"Fetching status from: {status_url}")
        try:
            response = requests.get(
                status_url,
                headers=headers,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()

            status_result = response.json()

            print(f"Publish Status: {status_result.get('status', 'Unknown')}")
            if status_result.get('errors'):
                print("Errors found:")
                for error in status_result['errors']:
                    print(f"  - Code: {error.get('errorCode')}, Message: {error.get('message')}")
            if status_result.get('warnings'):
                print("Warnings found:")
                for warning in status_result['warnings']:
                    print(f"  - Code: {warning.get('warningCode')}, Message: {warning.get('message')}")
            if status_result.get('notes'):
                print(f"Notes from API: {status_result.get('notes')}")

        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error during status check: {e}")
            print(f"Response status code: {e.response.status_code}")
            try:
                print("Response body:", json.dumps(e.response.json(), indent=2))
            except json.JSONDecodeError:
                print("Response body (non-JSON):", e.response.text)
            exit(1)
        except requests.exceptions.ConnectionError as e:
            print(f"Connection Error during status check: {e}")
            print("Please check your internet connection or the API endpoint.")
            exit(1)
        except requests.exceptions.Timeout as e:
            print(f"Timeout Error during status check: {e}")
            print(f"The request timed out after {REQUEST_TIMEOUT} seconds.")
            exit(1)
        except requests.exceptions.RequestException as e:
            print(f"An unexpected error occurred during status check: {e}")
            exit(1)
    else:
        print("Skipping status check because no operationId was obtained from the upload step.")

if __name__ == "__main__":
    main()