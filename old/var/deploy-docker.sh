#!/usr/bin/env bash
apk upgrade --no-cache
apk add --update curl

# Deploy to Docker Hub
docker pull psono-docker.jfrog.io/psono/psono-client:latest
docker tag psono-docker.jfrog.io/psono/psono-client:latest psono/psono-client:latest
docker push psono/psono-client:latest

export docker_version_tag=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' )
docker tag psono-docker.jfrog.io/psono/psono-client:latest psono/psono-client:$docker_version_tag
docker push psono/psono-client:$docker_version_tag


echo "Trigger psono combo rebuild"
curl -X POST -F token=$PSONO_COMBO_TRIGGER_TOKEN -F ref=master https://gitlab.com/api/v4/projects/16086547/trigger/pipeline
curl -X POST -F token=$PSONO_COMBO_EE_TRIGGER_TOKEN -F ref=master https://gitlab.com/api/v4/projects/16127995/trigger/pipeline
