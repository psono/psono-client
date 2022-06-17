if [ ! -z "$PSONO_WEBCLIENT_CONFIG_JSON" ]
then
      echo "$PSONO_WEBCLIENT_CONFIG_JSON" > /usr/share/nginx/html/config.json
fi

nginx -g "daemon off;"