#!/usr/bin/env bash
set -e

upload_if_exists() {
    if [ -f "$1" ]; then
        gcloud storage cp "$1" "$2"
    fi
}

apt-get update && \
apt-get install -y lsb-release curl gnupg && \
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg  add - && \
apt-get update -y && apt-get install google-cloud-cli -y && \
echo "$GOOGLE_APPLICATION_CREDENTIALS" > "/root/key.json" && \
gcloud auth activate-service-account --key-file=/root/key.json

for artifact in psono.x86_64.rpm psono.amd64.deb psono.x86_64.AppImage psono.x86_64.exe psono.x64.dmg psono.arm64.dmg sbom.json firefox-extension.zip chrome-extension.zip webclient.zip; do
    upload_if_exists "$artifact" "gs://get.psono.com/psono/psono-client/latest/$artifact"
    upload_if_exists "$artifact" "gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/$artifact"
done
