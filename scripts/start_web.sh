#!/usr/bin/dumb-init /bin/sh

nginx -g "daemon off;" &

/usr/local/bin/uwsgi --ini /opt/app/build_scripts/uwsgi.ini
