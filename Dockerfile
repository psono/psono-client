FROM nginx:alpine
MAINTAINER Sascha Pfeiffer <saschapfeiffer@psono.com>
COPY ./build/webserver /usr/share/nginx/html/
WORKDIR /root