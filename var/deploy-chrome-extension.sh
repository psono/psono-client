#!/usr/bin/env bash
mkdir -p /root/dist/chrome
cd /root/build/
zip -r /root/dist/chrome/psono.PW.zip chrome
cd /root/
gulp --webstore_client_id=$webstore_client_id --webstore_client_secret=$webstore_client_secret \
	--webstore_refresh_token=$webstore_refresh_token --webstore_app_id=$webstore_app_id chrome-deploy
