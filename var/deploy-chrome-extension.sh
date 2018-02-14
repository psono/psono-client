#!/usr/bin/env bash
cd /builds/psono/psono-client/
curl -fL https://getcli.jfrog.io | sh
./jfrog rt c rt-server-1 --url=https://psono.jfrog.io/psono --user=gitlab --password=$artifactory_credentials
./jfrog rt dl psono/client/$CI_BUILD_REF_NAME/chrome-extension.zip
gulp chrome-deploy
