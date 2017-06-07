#!/usr/bin/env bash
mkdir -p /builds/psono/psono-client/dist/firefox
cd /builds/psono/psono-client/build/firefox/
zip -r /builds/psono/psono-client/dist/firefox/psono.firefox.PW.zip *
cd /builds/psono/psono-client/