#!/usr/bin/env bash
mkdir -p /builds/esaqa/psono/psono-client/dist/webclient
cd /builds/esaqa/psono/psono-client/build/webclient/
zip -r /builds/esaqa/psono/psono-client/dist/webclient/psono.webclient.PW.zip *
cd /builds/esaqa/psono/psono-client/