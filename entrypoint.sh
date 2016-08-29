#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  test          : run tests
  start         : start django + uwsgi
  start_dev     : start django devserver
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
    # Linting tasks first
    flake8 ./hat
    npm run lint
    # Then tests
    ./scripts/wait_for_dbs.sh
    ./manage.py setupcouchdb
    ./manage.py test
    npm run mocha
  ;;
  "start" )
    envsubst "\$COUCHDB_URL" < build_scripts/nginx.conf > /etc/nginx/sites-available/default
    ./manage.py migrate
    ./manage.py collectstatic --noinput
    ./manage.py setupcouchdb
    ./scripts/start_web.sh
  ;;
  "start_dev" )
    ./scripts/wait_for_dbs.sh
    ./manage.py migrate
    ./manage.py setupcouchdb
    npm run webpack-server &
    ./manage.py runserver 0.0.0.0:8080
  ;;
  "start_rq" )
    ./scripts/start_rq.sh
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
    bash
  ;;
  * )
    show_help
  ;;
esac
