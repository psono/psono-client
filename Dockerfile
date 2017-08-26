FROM nginx:alpine
MAINTAINER Sascha Pfeiffer <saschapfeiffer@psono.com>
COPY ./build/webclient /usr/share/nginx/html/
WORKDIR /root