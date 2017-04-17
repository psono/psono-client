#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

force=0
version=""

# Parse arguments
# FROM http://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash/29754866#29754866
# As long as there is at least one more argument, keep looping
while [[ $# -gt 0 ]]; do
    key="$1"
    case "$key" in
        # This is a flag type option. Will catch either -f or --foo
        # The "force" parameter
        -f|--force)
        force=1
        ;;
#        # Also a flag type option. Will catch either -b or --bar
#        -b|--bar)
#        bar=1
#        ;;
        # This is an arg value type option. Will catch -o value or --output-file value
        -v|--verion)
        shift # past the key and to the value
        version="$1"
        ;;
        # This is an arg=value type option. Will catch -o=value or --output-file=value
        -v=*|--verion=*)
        # No need to shift here since the value is part of the same string
        version="${key#*=}"
        ;;
        *)
        # Do whatever you want with extra options
        echo "Unknown option '$key'"
        ;;
    esac
    # Shift after checking all the cases to get the next option
    shift
done

echo -e "01 - Checking that we are on the ${GREEN}develop${NC} branch"
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

if [ -z ${version+x} ] || [ -z "$version" ]; then
	old_version=$(cat src/common/data/VERSION.txt)
	echo -e "04 - Choose your new version (Old version: ${GREEN}${old_version}${NC})"
	read version
else
	echo -e "04 - New version specified as ${GREEN}${version}${NC}"
fi

if [ "${force}" -eq "1" ]; then
	echo -e "05 - The new version ${GREEN}${version}${NC}) is forced."
else
	echo -e "05 - Is the new version of ${GREEN}${version}${NC} correct? [yes / NO]"
	read yes_or_no
	yes_or_no=${yes_or_no,,}
	if [ "$yes_or_no" != "yes" ]; then
	    echo -e "${RED}Aborted${NC}"
	    exit 1
	fi
fi

version_tag_message="version ${version}"
version_tag="v${version}"
release_branch="release-${version}"
echo -e "06 - Creating release branch ${GREEN}${release_branch}${NC}"
git checkout -b $release_branch develop

echo -e "07 - Update version file"
echo "${version}" > src/common/data/VERSION.txt
gulp updateversion

echo -e "08 - Committing new VERSION.txt to ${release_branch}"
git commit -a -m "Bumped version number to ${version}"

echo -e "09 - Checking out ${GREEN}master${NC}"
git checkout master

echo -e "10 - Merging our ${GREEN}${release_branch}${NC} into ${GREEN}master${NC}"
git merge --no-ff $release_branch

echo -e "11 - Tagging release"
git tag -a ${version} -m ${version_tag_message}

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

echo -e "17 - Pushing ${GREEN}develop${NC} branch"
git push origin develop

echo -e "18 - Pushing ${GREEN}master${NC} branch"
git push origin master