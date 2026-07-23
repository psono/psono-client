#!/usr/bin/env bash
set -eu

: "${COSIGN_PRIVATE_KEY:?COSIGN_PRIVATE_KEY is required}"
: "${COSIGN_PUBLIC_KEY:?COSIGN_PUBLIC_KEY is required}"
: "${COSIGN_PASSWORD:?COSIGN_PASSWORD is required}"

apk upgrade --no-cache
apk add --update curl skopeo

cosign_version="3.1.2"
cosign_sha256="f7622ed3cf22e55e1ae6377c080979ff77a22da9981c11df222a2e444991e7cf"
curl -fSL "https://github.com/sigstore/cosign/releases/download/v${cosign_version}/cosign-linux-amd64" -o /tmp/cosign
echo "${cosign_sha256}  /tmp/cosign" | sha256sum -c -
chmod 0755 /tmp/cosign
mv /tmp/cosign /usr/local/bin/cosign

# Deploy to Docker Hub
skopeo copy --all docker://$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG docker://docker.io/psono/psono-client:latest

export docker_version_tag=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' )
skopeo copy --all docker://$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG docker://docker.io/psono/psono-client:$docker_version_tag

release_image="docker.io/psono/psono-client"
latest_digest="$(skopeo inspect --format '{{.Digest}}' "docker://${release_image}:latest")"
version_digest="$(skopeo inspect --format '{{.Digest}}' "docker://${release_image}:${docker_version_tag}")"

if [ "${latest_digest}" != "${version_digest}" ]; then
    echo "Docker Hub tags have different digests: latest=${latest_digest}, ${docker_version_tag}=${version_digest}" >&2
    exit 1
fi

cosign sign --yes --key env://COSIGN_PRIVATE_KEY "${release_image}@${version_digest}"

verification_attempt=1
until cosign verify --key env://COSIGN_PUBLIC_KEY "${release_image}@${version_digest}"; do
    if [ "${verification_attempt}" -ge 12 ]; then
        echo "Signature was not discoverable after ${verification_attempt} verification attempts" >&2
        exit 1
    fi
    echo "Signature is not discoverable yet; retrying in 10 seconds"
    verification_attempt=$((verification_attempt + 1))
    sleep 10
done

echo "Trigger psono combo rebuild"
curl -X POST -F token=$PSONO_COMBO_TRIGGER_TOKEN -F ref=master https://gitlab.com/api/v4/projects/16086547/trigger/pipeline
curl -X POST -F token=$PSONO_COMBO_EE_TRIGGER_TOKEN -F ref=master https://gitlab.com/api/v4/projects/16127995/trigger/pipeline
