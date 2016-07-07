#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  test          : run tests
  devserver     : start django devserver
  startcelery   : start celery
  manage        : run django manage.py
  """
}

case "$1" in
  test)
    flake8 && \
    ./manage.py test
  ;;
  devserver)
    until psql -h "db" -U "postgres" -c '\l'; do
      >&2 echo "Waiting for db..."
      sleep 1
    done
    ./manage.py runserver 0.0.0.0:8000
  ;;
  startcelery)
    celery -A hat worker -B -l INFO
  ;;
  manage)
    ./manage.py "${@:2}"
  ;;
  bash)
    bash
  ;;
  *)
    show_help
  ;;
esac
