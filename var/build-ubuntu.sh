#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip nodejs npm git apt-transport-https ca-certificates curl openssl && \
ln -s /usr/bin/nodejs /usr/bin/node && \
npm install && \
npm install gulp -g && \
npm install addons-linter -g && \
npm install karma-cli -g && \
npm install jpm --global && \
node --version && \
npm --version && \
gulp && \
gulp --commit_tag=$CI_COMMIT_TAG --commit_hash=$CI_COMMIT_HASH updateversion