#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  test             : run tests
  test_js          : run javascript tests
  test_integration : run integration tests
  start            : start django + uwsgi
  start_dev        : start django devserver
  start_webpack    : start webpack server (only in DEV mode)
  start_rq         : start rq worker
  start_jupyter    : start jupyter notebook
  manage           : run django manage.py
  eval             : eval shell command
  bash             : run bash
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
  "test_js" )
    npm run test
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
    if [ -n "$TEST_PROD" ]; then
      # Test prod configuration
      envsubst "\$COUCHDB_URL" < build_scripts/local/nginx.conf.local > /etc/nginx/sites-available/default
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
  "start_dev_ssl" )
    # ssl proxy to web
    envsubst "\$COUCHDB_URL" < build_scripts/local/nginx-ssl.conf.local > /etc/nginx/sites-available/default
    cp build_scripts/local/nginx.key.local /etc/nginx/cert.key
    cp build_scripts/local/nginx.crt.local /etc/nginx/cert.crt
    nginx -g "daemon off;"
  ;;
  "start_webpack" )
    # We only run this server if not testing prod config
    if [ -n "$TEST_PROD" ]; then
      exit 0
    fi
    npm run webpack-server
  ;;
  "start_rq" )
    ./scripts/start_rq.sh
  ;;
  "start_jupyter" )
    # We only run this server if not testing prod config
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
