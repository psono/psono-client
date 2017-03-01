#!/usr/bin/env bash
lsb_release -a && \
apt-get update && \
apt-get install -y nodejs npm && \
ln -s /usr/bin/nodejs /usr/bin/node && \
npm install && \
npm install gulp -g && \
npm install karma-cli -g && \
npm install jpm --global && \
apt-get clean && \
node --version && \
npm --version && \
gulp