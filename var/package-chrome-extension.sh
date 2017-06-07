#!/usr/bin/env bash
mkdir -p /builds/psono/psono-client/dist/chrome
cd /builds/psono/psono-client/build/chrome/
zip -r /builds/psono/psono-client/dist/chrome/psono.chrome.PW.zip *
cd /builds/psono/psono-client/