FROM ubuntu:16.04
ENV DEBIAN_FRONTEND noninteractive
MAINTAINER Sascha Pfeiffer <saschapfeiffer@psono.com>
COPY . /root/
WORKDIR /root
RUN sh build.sh