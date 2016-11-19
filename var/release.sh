#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color


echo -e "01 - Checking that we are on the ${GREEN}${old_version}${NC} branch"
current_branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
if [ "$current_branch" != "develop" ]; then
    echo -e "${RED}Aborted${NC}, please switch to develop and commit everything before trying to release."
    exit 1
fi

echo -e "02 - Checking that everything has been committed"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Aborted${NC}, please commit everything before running this script."
    exit 1
fi

echo -e "03 - Running gulp"
gulp default 1>/dev/null

old_version=$(cat src/common/data/VERSION.txt)
echo -e "04 - Choose your new version (Old version: ${GREEN}${old_version}${NC})"
read new_version

echo -e "05 - Is the new version of ${GREEN}${new_version}${NC} correct? [yes / NO]"
read yes_or_no
yes_or_no=${yes_or_no,,}
if [ "$yes_or_no" != "yes" ]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
fi

release_branch="release-${new_version}"
echo -e "06 - Creating release branch ${GREEN}${release_branch}${NC}"
git checkout -b $release_branch develop

echo -e "07 - Update version file"
echo "${new_version}" > src/common/data/VERSION.txt
gulp updateversion

echo -e "08 - Committing new VERSION.txt to ${release_branch}"
git commit -a -m "Bumped version number to ${new_version}"

echo -e "09 - Checking out ${GREEN}master${NC}"
git checkout master

echo -e "10 - Merging our ${GREEN}${release_branch}${NC} into ${GREEN}master${NC}"
git merge --no-ff $release_branch

echo -e "11 - Tagging release"
git tag -a ${new_version}

echo -e "12 - Creating xpi file"
gulp xpi

echo -e "13 - Creating crx file"
gulp crx

echo -e "14 - Checking out ${GREEN}develop${NC}"
git checkout develop

echo -e "15 - Merging our ${GREEN}${release_branch}${NC} into ${GREEN}develop${NC}"
git merge --no-ff $release_branch

echo -e "16 - Deleting ${GREEN}${release_branch}${NC}"
git branch -d $release_branch
