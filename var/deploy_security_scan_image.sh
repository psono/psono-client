#!/usr/bin/env bash

# Pull docker container here, as the login will be overwritten in the next step
docker pull $CONTAINER_TEST_IMAGE

# Deploy to Docker Hub
mkdir -p /root/.docker
cat > /root/.docker/config.json <<- "EOF"
{
        "auths": {
                "https://index.docker.io/v1/": {
                        "auth": "docker_hub_credentials"
                }
        }
}
EOF
sed -i 's/docker_hub_credentials/'"$docker_hub_credentials"'/g' /root/.docker/config.json
docker tag $CONTAINER_TEST_IMAGE psono/security-scans:psono-client-ce-$CI_BUILD_REF_NAME
docker push psono/security-scans:psono-client-ce-$CI_BUILD_REF_NAME