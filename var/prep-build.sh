#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip git apt-transport-https ca-certificates curl build-essential openssl && \
curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
apt-get install -y nodejs && \
node --version && \
npm --version && \
npm ci && \
npm install -g node-poeditor && \
npm install -g add gulp
