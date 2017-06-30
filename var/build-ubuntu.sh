#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip nodejs npm git apt-transport-https ca-certificates curl openssl && \
ln -s /usr/bin/nodejs /usr/bin/node && \
node --version && \
npm --version && \
npm install && \
npm install gulp -g && \
npm install addons-linter -g && \
npm install karma-cli -g && \
npm install jpm --global && \
gulp && \
gulp --commit_tag=$CI_COMMIT_TAG --commit_sha=$CI_COMMIT_SHA updateversion