FROM psono-docker.jfrog.io/nginx:alpine
LABEL maintainer="Sascha Pfeiffer <sascha.pfeiffer@psono.com>"
COPY ./build/webclient /usr/share/nginx/html/
WORKDIR /root