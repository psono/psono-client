#!/usr/bin/env bash
cd /builds/psono/psono-client/
gulp --mozilla_jwt_issuer=$mozilla_jwt_issuer --mozilla_jwt_secret=$mozilla_jwt_secret \
	--mozilla_addon_id=$mozilla_addon_id --mozilla_version=${CI_COMMIT_TAG:1:100} firefox-deploy