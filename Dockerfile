FROM ubuntu:14.04
ENV DEBIAN_FRONTEND noninteractive
MAINTAINER Sascha Pfeiffer <saschapfeiffer@sanso.pw>
COPY . /root/
WORKDIR /root
RUN apt-get update && \
    apt-get install -y nodejs npm xvfb chromium-browser && \
    ln -s /usr/bin/nodejs /usr/bin/node && \
    export DISPLAY=:99.0 && \
    export CHROME_BIN=/usr/bin/chromium-browser && \
    npm install && \
    npm install gulp -g && \
    npm install karma-cli -g && \
    npm install coffee-script -g && \
    apt-get clean && \
    gulp