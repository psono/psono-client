#!/usr/bin/env bash
mkdir -p /builds/esaqa/psono/psono-client/dist/firefox
cd /builds/esaqa/psono/psono-client/build/firefox/
zip -r /builds/esaqa/psono/psono-client/dist/firefox/psono.firefox.PW.zip *
cd /builds/esaqa/psono/psono-client/