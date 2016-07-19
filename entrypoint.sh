#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  test          : run tests
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
  "start_devweb" )
    until psql -h "db" -U "postgres" -c '\l'; do
      >&2 echo "Waiting for db..."
      sleep 1
    done
    ./manage.py runserver 0.0.0.0:8000
  ;;
  "start_rq" )
    export DJANGO_SETTINGS_MODULE=hat.settings
    rq worker
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
  * )
    show_help
  ;;
esac
