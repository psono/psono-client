#!/usr/bin/env bash
apt-get update && \
apt-get install -y lsb-release curl gnupg && \
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg  add - && \
apt-get update -y && apt-get install google-cloud-cli -y && \
echo "$GOOGLE_APPLICATION_CREDENTIALS" > "/root/key.json" && \
gcloud auth activate-service-account --key-file=/root/key.json && \
curl -fL https://getcli.jfrog.io | sh && \
./jfrog config add rt-server-1 --artifactory-url=https://psono.jfrog.io/psono --user=gitlab --password=$artifactory_credentials --interactive=false && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x86_64.rpm --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.amd64.deb --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x86_64.AppImage --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x86_64.exe --flat && \
 \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x64.dmg --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.arm64.dmg --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/firefox-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/chrome-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/webclient.zip --flat && \
gsutil cp psono.x86_64.rpm gs://get.psono.com/psono/psono-client/latest/psono.x86_64.rpm && \
gsutil cp psono.amd64.deb gs://get.psono.com/psono/psono-client/latest/psono.amd64.deb && \
gsutil cp psono.x86_64.AppImage gs://get.psono.com/psono/psono-client/latest/psono.x86_64.AppImage && \
gsutil cp psono.x86_64.exe gs://get.psono.com/psono/psono-client/latest/psono.x86_64.exe && \
 \
gsutil cp psono.x64.dmg gs://get.psono.com/psono/psono-client/latest/psono.x64.dmg && \
gsutil cp psono.arm64.dmg gs://get.psono.com/psono/psono-client/latest/psono.arm64.dmg && \
gsutil cp sbom.json gs://get.psono.com/psono/psono-client/latest/sbom.json && \
gsutil cp firefox-extension.zip gs://get.psono.com/psono/psono-client/latest/firefox-extension.zip && \
gsutil cp chrome-extension.zip gs://get.psono.com/psono/psono-client/latest/chrome-extension.zip && \
gsutil cp webclient.zip gs://get.psono.com/psono/psono-client/latest/webclient.zip && \
gsutil cp psono.x86_64.rpm gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.x86_64.rpm && \
gsutil cp psono.amd64.deb gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.amd64.deb && \
gsutil cp psono.x86_64.AppImage gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.x86_64.AppImage && \
gsutil cp psono.x86_64.exe gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.x86_64.exe && \
 \
gsutil cp psono.x64.dmg gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.x64.dmg && \
gsutil cp psono.arm64.dmg gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/psono.arm64.dmg && \
gsutil cp sbom.json gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/sbom.json && \
gsutil cp firefox-extension.zip gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/firefox-extension.zip && \
gsutil cp chrome-extension.zip gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/chrome-extension.zip && \
gsutil cp webclient.zip gs://get.psono.com/psono/psono-client/$CI_COMMIT_REF_NAME/webclient.zip
