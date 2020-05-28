FROM psono-docker.jfrog.io/nginx:alpine

LABEL maintainer="Sascha Pfeiffer <sascha.pfeiffer@psono.com>"

RUN apk upgrade --no-cache \
	&& apk add --no-cache curl

COPY ./configs/nginx.conf /etc/nginx/nginx.conf
COPY ./configs/default.conf /etc/nginx/conf.d/default.conf
COPY ./configs/cmd.sh /root/cmd.sh
COPY ./build/webclient /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s \
	CMD curl -f http://localhost/ || exit 1

CMD ["/bin/sh", "/root/cmd.sh"]
