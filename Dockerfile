FROM nginx:alpine
MAINTAINER Sascha Pfeiffer <saschapfeiffer@psono.com>
COPY ./src/common/data /usr/share/nginx/html/
WORKDIR /root