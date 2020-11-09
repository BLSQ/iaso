#!/bin/bash
set -e

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

case "$1" in
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
  "start" )
    ./manage.py compilemessages -l fr
    ./manage.py migrate --noinput
    ./manage.py collectstatic --noinput
    ./scripts/start_web.sh
  ;;
  "start_dev" )
    if [ -n "$TEST_PROD" ]; then
      ./scripts/wait_for_dbs.sh
      ./manage.py compilemessages -l fr
      ./manage.py migrate --noinput
      npm run webpack-prod
      ./manage.py collectstatic --noinput
      ./scripts/start_web.sh
    else
      export DEV_SERVER=true
      export SHOW_DEBUG_TOOLBAR=true
      ./scripts/wait_for_dbs.sh
      ./manage.py migrate --noinput
      ./manage.py runserver 0.0.0.0:8080
    fi
  ;;
  "start_webpack" )
    # We only run this server if not testing prod config
    if [ -n "$TEST_PROD" ]; then
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
