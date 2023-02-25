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
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x86_64.exe --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.x86_64.msi --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/psono.dmg --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/firefox-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/chrome-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/webclient.zip --flat && \
gsutil cp psono.x86_64.rpm gs://get.psono.com/$CI_PROJECT_PATH/nightly/psono.x86_64.rpm && \
gsutil cp psono.amd64.deb gs://get.psono.com/$CI_PROJECT_PATH/nightly/psono.amd64.deb && \
gsutil cp psono.x86_64.exe gs://get.psono.com/$CI_PROJECT_PATH/nightly/psono.x86_64.exe && \
gsutil cp psono.x86_64.msi gs://get.psono.com/$CI_PROJECT_PATH/nightly/psono.x86_64.msi && \
gsutil cp psono.x86_64.dmg gs://get.psono.com/$CI_PROJECT_PATH/nightly/psono.x86_64.dmg && \
gsutil cp firefox-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/nightly/firefox-extension.zip && \
gsutil cp chrome-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/nightly/chrome-extension.zip && \
gsutil cp webclient.zip gs://get.psono.com/$CI_PROJECT_PATH/nightly/webclient.zip
