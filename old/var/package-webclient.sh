#!/usr/bin/env bash
mkdir -p /builds/psono/psono-client/dist/webclient
cd /builds/psono/psono-client/build/webclient/
zip -r /builds/psono/psono-client/dist/webclient/psono.webclient.PW.zip *
cd /builds/psono/psono-client/