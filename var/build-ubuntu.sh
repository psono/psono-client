#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip npm git apt-transport-https ca-certificates curl openssl && \
# ln -s /usr/bin/nodejs /usr/bin/node && \
npm i -g npm && \
npm cache clean -f && \
npm install -g n && \
n stable && \
node --version && \
npm --version && \
npm install && \
npm install gulp -g && \
npm install addons-linter -g && \
npm install karma-cli -g && \
npm install jpm --global && \
gulp && \
gulp --commit_tag=$CI_COMMIT_TAG --commit_sha=$CI_COMMIT_SHA updateversion