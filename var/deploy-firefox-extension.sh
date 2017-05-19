#!/usr/bin/env bash
cd /builds/psono/psono-client/
gulp --mozilla_jwt_issuer=$mozilla_jwt_issuer --mozilla_jwt_secret=$mozilla_jwt_secret \
	--mozilla_addon_id=$mozilla_addon_id --mozilla_version=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' ) firefox-deploy