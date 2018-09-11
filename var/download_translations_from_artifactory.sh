#!/usr/bin/env bash
# poeditor language codes: https://poeditor.com/docs/languages
apt-get update && \
apt-get install -y curl && \
curl -o src/common/data/translations/locale-de.json https://psono.jfrog.io/psono/psono/client/languages/locale-cs.json && \
curl -o src/common/data/translations/locale-de.json https://psono.jfrog.io/psono/psono/client/languages/locale-de.json && \
curl -o src/common/data/translations/locale-en.json https://psono.jfrog.io/psono/psono/client/languages/locale-en.json && \
curl -o src/common/data/translations/locale-es.json https://psono.jfrog.io/psono/psono/client/languages/locale-es.json && \
curl -o src/common/data/translations/locale-fi.json https://psono.jfrog.io/psono/psono/client/languages/locale-fi.json && \
curl -o src/common/data/translations/locale-fr.json https://psono.jfrog.io/psono/psono/client/languages/locale-fr.json && \
curl -o src/common/data/translations/locale-hr.json https://psono.jfrog.io/psono/psono/client/languages/locale-hr.json && \
curl -o src/common/data/translations/locale-it.json https://psono.jfrog.io/psono/psono/client/languages/locale-it.json && \
curl -o src/common/data/translations/locale-ja.json https://psono.jfrog.io/psono/psono/client/languages/locale-ja.json && \
curl -o src/common/data/translations/locale-ko.json https://psono.jfrog.io/psono/psono/client/languages/locale-ko.json && \
curl -o src/common/data/translations/locale-nl.json https://psono.jfrog.io/psono/psono/client/languages/locale-nl.json && \
curl -o src/common/data/translations/locale-pl.json https://psono.jfrog.io/psono/psono/client/languages/locale-pl.json && \
curl -o src/common/data/translations/locale-ru.json https://psono.jfrog.io/psono/psono/client/languages/locale-ru.json && \
curl -o src/common/data/translations/locale-vi.json https://psono.jfrog.io/psono/psono/client/languages/locale-vi.json && \
curl -o src/common/data/translations/locale-zh-cn.json https://psono.jfrog.io/psono/psono/client/languages/locale-zh-cn.json
