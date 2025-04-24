#!/usr/bin/env bash
apt-get update && \
apt-get install -y libfontconfig zip git apt-transport-https ca-certificates curl build-essential openssl gnupg && \
mkdir -p /etc/apt/keyrings && \
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg  && \
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list  && \
apt-get update && \
apt-get install -y nodejs && \
node --version && \
npm --version && \
npm ci && \
npm install -g node-poeditor
