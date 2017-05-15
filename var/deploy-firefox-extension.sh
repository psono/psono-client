#!/usr/bin/env bash
mkdir -p /builds/psono/psono-client/dist/firefox
cd /builds/psono/psono-client/build/firefox/
zip -r /builds/psono/psono-client/dist/firefox/psono.PW.zip *
cd /builds/psono/psono-client/
gulp --mozilla_jwt_issuer=$mozilla_jwt_issuer --mozilla_jwt_secret=$mozilla_jwt_secret \
	--mozilla_addon_id=$mozilla_addon_id --mozilla_version=${CI_COMMIT_TAG:1:100} firefox-deploy