#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  test          : run tests
  start         : start django supervisor + uwsgi
  start_devweb  : start django devserver
  start_rq      : start rq worker
  start_jupyter : start jupyter notebook
  celery        : run celery commands
  manage        : run django manage.py
  eval          : eval shell command
  """
}

case "$1" in
  "test" )
    export TESTING=true
    flake8
    ./manage.py test
  ;;
  "start" )
    python manage.py migrate
    python manage.py collectstatic --noinput
    dumb-init nginx -g "daemon off;" &
    dumb-init /usr/local/bin/uwsgi --ini /opt/app/build_scripts/uwsgi.ini
  ;;
  "start_devweb" )
    until psql -h "db" -U "postgres" -c '\l'; do
      >&2 echo "Waiting for db..."
      sleep 1
    done
    ./manage.py runserver 0.0.0.0:8000
  ;;
  "start_rq" )
    ./manage.py rq_worker
  ;;
  "start_jupyter" )
    export DJANGO_SETTINGS_MODULE=hat.settings
    jupyter notebook -y --no-browser --ip=0.0.0.0
  ;;
  "manage" )
    ./manage.py "${@:2}"
  ;;
  "eval" )
    eval "${@:2}"
  ;;
  "bash" )
    envsubst < /opt/app/build_scripts/supervisor.hat.conf.tmpl > /etc/supervisor/conf.d/hat.conf
    bash
  ;;
  * )
    show_help
  ;;
esac
