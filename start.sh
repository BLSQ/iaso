#!/usr/bin/dumb-init /bin/sh

nginx -g "daemon off;" &

if [ -z ${NEW_RELIC_LICENSE_KEY} ]; then 
  /usr/local/bin/uwsgi --ini /opt/app/build_scripts/uwsgi.ini
else 
  newrelic-admin run-program /usr/local/bin/uwsgi --ini /opt/app/build_scripts/uwsgi.ini
fi
