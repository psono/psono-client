#!/usr/bin/env bash
mkdir -p /builds/psono/psono-client/dist/chrome
cd /builds/psono/psono-client/build/chrome/
zip -r /builds/psono/psono-client/dist/chrome/psono.PW.zip *
cd /builds/psono/psono-client/
gulp --webstore_client_id=$webstore_client_id --webstore_client_secret=$webstore_client_secret \
	--webstore_refresh_token=$webstore_refresh_token --webstore_app_id=$webstore_app_id chrome-deploy
