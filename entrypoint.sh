#!/bin/bash
set -e

# This script is used as the entrypoint for docker when used for local dev

show_help() {
  echo """
  Commands
  ---------------------------------------------------------------

  start            : start django + uwsgi
  start_dev        : start django devserver
  start_webpack    : start webpack server (only in DEV mode)

  manage           : run django manage.py
  eval             : eval shell command
  bash             : run bash
  """
}

export PYTHONPATH="/opt/app:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE=hat.settings
export PLUGINS=wfp

case "$1" in
  "start")
    ./scripts/wait_for_dbs.sh
    ./manage.py migrate --noinput
    ./manage.py runserver 0.0.0.0:8081
    ;;
  "start_gunicorn")
    ./scripts/wait_for_dbs.sh
    ./manage.py migrate --noinput
    gunicorn hat.wsgi --bind=0.0.0.0:8081 --timeout 600
  ;;
  "test" )
    export TESTING=true
    # Linting tasks first
    flake8 ./hat
    npm run lint
    # Then tests
    ./scripts/wait_for_dbs.sh
    # Run python tests and pass on any args to e.g. run individual tests
    ./manage.py test --exclude-tag selenium "${@:2}"
    npm run mocha
  ;;
  "test_lint" )
    export TESTING=true
    flake8 ./hat -v
    npm run lint
  ;;
  "test_js" )
    npm run test
  ;;
  "mocha" )
    npm run mocha
  ;;
  "gen_docs" )
    ./scripts/gen_docs.sh
  ;;
  "start_dev" )
    export DEV_SERVER=true
    ./scripts/wait_for_dbs.sh
    ./manage.py migrate --noinput
    ./manage.py createcachetable
    ./manage.py compilemessages
    ./manage.py runserver 0.0.0.0:8081
  ;;
  "start_webpack" )
    # if TEST_PROD, make a static js bundle otherwhise launch js dev server
    if [ -n "$TEST_PROD" ]; then
      npm run webpack-prod
      exit 0
    fi

    npm run webpack-server
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
  "python" )
    python "${@:2}"
  ;;
  * )
    show_help
  ;;
esac
