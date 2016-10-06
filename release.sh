#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color


echo -e "01 - Checking that we are on the ${GREEN}${old_version}${NC} branch"
current_branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
if [ "$current_branch" != "develop" ]; then
    echo -e " ${GREEN}Aborted${NC}, please switch to develop and commit everything before trying to release."
    exit 1
fi

echo -e "02 - Running gulp"
gulp default 1>/dev/null

old_version=$(cat src/common/data/VERSION.txt)
echo -e "03 - Choose your new version (Old version: ${GREEN}${old_version}${NC})"
read new_version

echo -e "04 - Is the new version of ${GREEN}${new_version}${NC} correct? [yes / NO]"
read yes_or_no
yes_or_no=${yes_or_no,,}
if [ "$yes_or_no" != "yes" ]; then
    echo -e "${GREEN}Aborted${NC}"
    exit 1
fi

release_branch="release-${new_version}"
echo -e "05 - Creating release branch ${GREEN}${release_branch}${NC}"
git checkout -b $release_branch develop

echo -e "06 - Update version file"
echo "${new_version}" > src/common/data/VERSION.txt
gulp updateversion

echo -e "07 - Committing new VERSION.txt to ${release_branch}"
git commit -a -m "Bumped version number to ${new_version}"

echo -e "08 - Checking out ${GREEN}master${NC}"
git checkout master

echo -e "09 - Merging our ${GREEN}${release_branch}${NC} into ${GREEN}master${NC}"
git merge --no-ff $release_branch

echo -e "09 - Tagging release"
git tag -a ${new_version}

echo -e "10 - Creating xpi file"
gulp xpi

echo -e "11 - Creating crx file"
gulp crx

echo -e "12 - Checking out ${GREEN}develop${NC}"
git checkout develop

echo -e "13 - Merging our ${GREEN}${release_branch}${NC} into ${GREEN}develop${NC}"
git merge --no-ff $release_branch

echo -e "14 - Deleting ${GREEN}${release_branch}${NC}"
git branch -d $release_branch
