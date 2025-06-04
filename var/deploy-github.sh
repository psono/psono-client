#!/usr/bin/env bash
echo "Clonging gitlab.com/esaqa/psono/psono-client.git"
git clone https://gitlab.com/esaqa/psono/psono-client.git
cd psono-client
git branch --track develop origin/develop
git fetch --all
git pull --all

echo "Empty .ssh folder"
if [ -d "/root/.ssh" ]; then
    rm -Rf /root/.ssh;
fi
mkdir -p /root/.ssh

echo "Fill .ssh folder"
echo "$github_deploy_key" > /root/.ssh/id_rsa
cat > /root/.ssh/known_hosts <<- "EOF"
|1|AuV+6vt2c6yHKSBI3cGlgiQgBw0=|oReK12ycO4x62cIfNqNIvclb2Ao= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
|1|rLMxkb3I+R6GmInBad4kitV0ZTk=|c7GxoZTzebOPBENzRmPEylRcgtY= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
EOF
chmod 600 /root/.ssh/id_rsa
chmod 600 /root/.ssh/known_hosts

echo "Push to github.com/psono/psono-client.git"
git remote set-url origin git@github.com:psono/psono-client.git
git push --all origin
