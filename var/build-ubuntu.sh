#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip git apt-transport-https ca-certificates curl build-essential openssl && \
curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
apt-get install -y nodejs && \
node --version && \
npm --version && \
npm config set registry https://psono.jfrog.io/psono/api/npm/npm/ && \
npm install && \
npm install gulp -g && \
npm install addons-linter -g --unsafe-perm && \
npm install karma-cli -g && \
gulp && \
gulp --commit_tag=$CI_COMMIT_TAG --commit_sha=$CI_COMMIT_SHA updateversion