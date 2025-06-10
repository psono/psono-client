#!/usr/bin/env bash
mkdir -p /builds/esaqa/psono/psono-client/dist/chrome
cd /builds/esaqa/psono/psono-client/build/chrome/
zip -r /builds/esaqa/psono/psono-client/dist/chrome/psono.chrome.PW.zip *
cd /builds/esaqa/psono/psono-client/