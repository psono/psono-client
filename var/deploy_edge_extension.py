import os
from edge_addons_api.client import Options, Client

def main():
    EDGE_PRODUCT_ID = os.environ.get('EDGE_PRODUCT_ID')
    EDGE_CLIENT_ID = os.environ.get('EDGE_CLIENT_ID')
    EDGE_CLIENT_SECRET = os.environ.get('EDGE_CLIENT_SECRET')
    EDGE_ACCESS_TOKEN_URL = os.environ.get('EDGE_ACCESS_TOKEN_URL')
    EDGE_NOTES = os.environ.get('EDGE_NOTES')

    options = Options(
        product_id=EDGE_PRODUCT_ID,
        client_id=EDGE_CLIENT_ID,
        client_secret=EDGE_CLIENT_SECRET,
        access_token_url=EDGE_ACCESS_TOKEN_URL
    )

    client = Client(options)

    # Upload extension
    operation_id = client.submit(
        file_path="edge-extension.zip",
        notes=EDGE_NOTES
    )

    # Check publish status
    client.fetch_publish_status(operation_id)


if __name__ == "__main__":
    main()