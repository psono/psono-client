#!/usr/bin/env bash
# poeditor language codes: https://poeditor.com/docs/languages
apt-get update && \
apt-get install -y curl && \
curl -o src/common/data/translations/locale-da.json https://psono.jfrog.io/psono/psono/client/languages/locale-da.json && \
curl -o src/common/data/translations/locale-sv.json https://psono.jfrog.io/psono/psono/client/languages/locale-sv.json && \
curl -o src/common/data/translations/locale-no.json https://psono.jfrog.io/psono/psono/client/languages/locale-no.json && \
curl -o src/common/data/translations/locale-he.json https://psono.jfrog.io/psono/psono/client/languages/locale-he.json && \
curl -o src/common/data/translations/locale-ar.json https://psono.jfrog.io/psono/psono/client/languages/locale-ar.json && \
curl -o src/common/data/translations/locale-hi.json https://psono.jfrog.io/psono/psono/client/languages/locale-hi.json && \
curl -o src/common/data/translations/locale-bn.json https://psono.jfrog.io/psono/psono/client/languages/locale-bn.json && \
curl -o src/common/data/translations/locale-cs.json https://psono.jfrog.io/psono/psono/client/languages/locale-cs.json && \
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
curl -o src/common/data/translations/locale-pt_PT.json https://psono.jfrog.io/psono/psono/client/languages/locale-pt_PT.json && \
curl -o src/common/data/translations/locale-pt_BR.json https://psono.jfrog.io/psono/psono/client/languages/locale-pt_BR.json && \
curl -o src/common/data/translations/locale-pl.json https://psono.jfrog.io/psono/psono/client/languages/locale-pl.json && \
curl -o src/common/data/translations/locale-ru.json https://psono.jfrog.io/psono/psono/client/languages/locale-ru.json && \
curl -o src/common/data/translations/locale-vi.json https://psono.jfrog.io/psono/psono/client/languages/locale-vi.json && \
curl -o src/common/data/translations/locale-zh-cn.json https://psono.jfrog.io/psono/psono/client/languages/locale-zh-cn.json
