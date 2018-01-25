#!/usr/bin/env bash
cd /builds/psono/psono-client/
apt-get update
apt-get install -y curl
curl -u gitlab:$artifactory_credentials -O https://psono.jfrog.io/psono/psono/client/$CI_BUILD_REF_NAME/chrome-extension.zip
gulp chrome-deploy
