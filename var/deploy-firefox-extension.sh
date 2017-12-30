#!/usr/bin/env bash
cd /builds/psono/psono-client/
export mozilla_version=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' )

gulp firefox-deploy
