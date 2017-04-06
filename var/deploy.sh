#!/usr/bin/env bash
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
docker pull registry.gitlab.com/psono/psono-client:latest
docker tag registry.gitlab.com/psono/psono-client:latest psono/psono-client:latest
docker push psono/psono-client:latest
curl -X POST https://hooks.microbadger.com/images/psono/psono-client/jMnJgDVZTpT4TUX-RlxTKa38Nc4=
curl -X POST $psono_image_updater_url
