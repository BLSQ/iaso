#!/bin/bash
set -e

show_help() {
  echo """
  Commands
  ---------------------------------------------------------------

  test             : run tests
  test_js          : run javascript tests
  test_integration : run integration tests

  gen_docs         : generate app docs

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
  "test_integration" )
    export TESTING=true
    ./scripts/wait_for_dbs.sh
    # create static files
    npm run webpack
    ./manage.py test --tag=selenium --failfast
  ;;
  "gen_docs" )
    ./scripts/gen_docs.sh
  ;;
  "start" )
    envsubst "\$COUCHDB_URL" < build_scripts/nginx.conf > /etc/nginx/sites-available/default
    cat build_scripts/prod/www.trypelim.org/fullchain.pem > /etc/nginx/fullchain.pem
    cat build_scripts/prod/www.trypelim.org/privkey.pem > /etc/nginx/privkey.pem
    ./manage.py compilemessages -l fr
    ./manage.py migrate --noinput
    ./scripts/gen_docs.sh
    ./manage.py collectstatic --noinput
    ./scripts/start_web.sh
  ;;
  "start_dev" )
    if [ -n "$TEST_PROD" ]; then
      # Test prod configuration
      envsubst "\$COUCHDB_URL" < build_scripts/local/nginx.conf.local > /etc/nginx/sites-available/default
      ./scripts/wait_for_dbs.sh
      ./scripts/gen_docs.sh
      ./manage.py compilemessages -l fr
      ./manage.py migrate --noinput
      npm run webpack
      ./manage.py collectstatic --noinput
      ./scripts/start_web.sh
    else
      export DEV_SERVER=true
      export SHOW_DEBUG_TOOLBAR=true
      ./scripts/wait_for_dbs.sh
      ./scripts/gen_docs.sh
      ./manage.py migrate --noinput
      ./manage.py runserver 0.0.0.0:8080
    fi
  ;;
  "start_dev_nginx" )
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
    ./manage.py rqscheduler &
    ./manage.py rqworker default
  ;;
  "start_dev_rq" )
    # In local dev we assign a random name to the rq worker,
    # to get around conflicts when restarting its container.
    # RQ uses the PID as part of it's name and that does not
    # change with container restarts and RQ the exits because
    # it finds the old worker under it's name in redis.
    ./manage.py rqscheduler &
    ./manage.py rqworker default --name "rq-${RANDOM}"
  ;;
  "start_jupyter" )
    # We only run this server if not testing prod config
    if [ -n "$TEST_PROD" ]; then
      exit 0
    fi
    jupyter notebook -y --no-browser --ip=0.0.0.0 --config=/opt/notebooks/jupyter_notebook_config.py --notebook-dir=/opt/notebooks/
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
