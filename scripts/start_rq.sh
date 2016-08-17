#!/usr/bin/dumb-init /bin/sh

if [ -z ${NEW_RELIC_LICENSE_KEY} ]; then 
  ./manage.py rq_worker
else 
  newrelic-admin run-python manage.py rq_worker
fi
