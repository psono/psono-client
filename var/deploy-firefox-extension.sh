#!/usr/bin/env bash
cd /builds/psono/psono-client/
curl -u gitlab:$artifactory_credentials -O https://psono.jfrog.io/psono/psono/client/$CI_BUILD_REF_NAME/firefox-extension.zip
export mozilla_version=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' )
gulp firefox-deploy
