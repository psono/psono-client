if [ ! -z "$PSONO_WEBCLIENT_CONFIG_JSON" ]
then
      echo "$PSONO_WEBCLIENT_CONFIG_JSON" > /usr/share/nginx/html/config.json
fi

if [ ! -z "$PSONO_SERVICE_WORKER_DISABLE" ]
then
      echo "" > /usr/share/nginx/html/js/service-worker-load.js
fi

nginx -g "daemon off;"