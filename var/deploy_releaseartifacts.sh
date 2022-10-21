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
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/firefox-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/chrome-extension.zip --flat && \
./jfrog rt dl psono/client/$CI_COMMIT_REF_NAME/webclient.zip --flat && \
gsutil cp firefox-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/latest/firefox-extension.zip && \
gsutil cp chrome-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/latest/chrome-extension.zip && \
gsutil cp webclient.zip gs://get.psono.com/$CI_PROJECT_PATH/latest/webclient.zip && \
gsutil cp firefox-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/$CI_COMMIT_REF_NAME/firefox-extension.zip && \
gsutil cp chrome-extension.zip gs://get.psono.com/$CI_PROJECT_PATH/$CI_COMMIT_REF_NAME/chrome-extension.zip && \
gsutil cp webclient.zip gs://get.psono.com/$CI_PROJECT_PATH/$CI_COMMIT_REF_NAME/webclient.zip
