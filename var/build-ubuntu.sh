#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip git apt-transport-https ca-certificates curl build-essential openssl && \
curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
apt-get install -y nodejs && \
node --version && \
npm --version && \
npm install --global yarn && \
yarn config set registry https://psono.jfrog.io/psono/api/npm/npm/ && \
yarn install && \
yarn global add gulp && \
yarn global add addons-linter && \
yarn global add karma-cli && \
yarn global add node-poeditor && \
gulp && \
gulp updateversion