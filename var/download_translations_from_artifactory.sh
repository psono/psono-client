#!/usr/bin/env bash
apt-get update && \
apt-get install -y curl && \
curl -o src/common/data/translations/locale-de.json https://psono.jfrog.io/psono/psono/client/languages/locale-de.json && \
curl -o src/common/data/translations/locale-en.json https://psono.jfrog.io/psono/psono/client/languages/locale-en.json
