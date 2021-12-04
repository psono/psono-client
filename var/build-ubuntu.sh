#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip git apt-transport-https ca-certificates curl build-essential openssl && \
curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
apt-get install -y nodejs && \
node --version && \
npm --version && \
#npm config set registry https://psono.jfrog.io/psono/api/npm/npm/ && \
#npm config set @typescript-eslint:registry https://psono.jfrog.io/psono/api/npm/npm/ && \
#npm config set @types:registry https://psono.jfrog.io/psono/api/npm/npm/ && \
#npm config set @babel:registry https://psono.jfrog.io/psono/api/npm/npm/ && \
#npm config set @webassemblyjs:registry https://psono.jfrog.io/psono/api/npm/npm/ && \
npm install && \
npm install -g node-poeditor && \
npm install -g add gulp && \
npm run build && \
gulp updateversion
