#!/usr/bin/env bash
set -e

test -f firefox-extension.zip
test -f source.zip
export mozilla_version=$(echo $CI_COMMIT_TAG | awk  '{ string=substr($0, 2, 100); print string; }' )
npm run deployfirefox
