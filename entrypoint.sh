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
  manage        : run django manage.py
  eval          : eval shell command
  bash          : run bash
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
    ./manage.py test --exclude-tag selenium
    npm run mocha
  ;;
  "test_mocha" )
    export TESTING=true
    # Linting tasks first
    flake8 ./hat
    npm run lint
    # Then tests
    npm run mocha
  ;;
  "test_integration" )
    export TESTING=true
    ./scripts/wait_for_dbs.sh
    ./manage.py setupcouchdb
    # create static files
    npm run webpack
    ./manage.py test --tag=selenium --failfast
  ;;
  "start" )
    envsubst "\$COUCHDB_URL" < build_scripts/nginx.conf > /etc/nginx/sites-available/default
    ./manage.py compilemessages -l fr
    ./manage.py migrate --noinput
    ./manage.py collectstatic --noinput
    ./manage.py setupcouchdb
    ./scripts/start_web.sh
  ;;
  "start_dev" )
    # When TEST_PROD is set, start the container in prod mode
    if [ -n "$TEST_PROD" ]; then
      envsubst "\$COUCHDB_URL" < build_scripts/nginx.conf.local > /etc/nginx/sites-available/default
      ./scripts/wait_for_dbs.sh
      ./manage.py compilemessages -l fr
      ./manage.py migrate --noinput
      npm run webpack
      ./manage.py collectstatic --noinput
      ./manage.py setupcouchdb
      ./scripts/start_web.sh
    else
      export DEV_SERVER=true
      export SHOW_DEBUG_TOOLBAR=true
      ./scripts/wait_for_dbs.sh
      ./manage.py migrate --noinput
      ./manage.py setupcouchdb
      ./manage.py runserver 0.0.0.0:8080
    fi
  ;;
  "start_webpack" )
    # We only run this server if DEBUG is set
    if [ -n "$TEST_PROD" ]; then
      exit 0
    fi
    npm run webpack-server
  ;;
  "start_rq" )
    ./scripts/start_rq.sh
  ;;
  "start_jupyter" )
    # We only run this server if DEBUG is set
    if [ -n "$TEST_PROD" ]; then
      exit 0
    fi
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
