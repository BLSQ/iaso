#!/usr/bin/env bash
source bin/activate
export SECRET_KEY="secret"
export RDS_PORT="5433"
export RDS_HOSTNAME="localhost"
export DEBUG="true"
export CACHE="false"
export DEV_SERVER="true"
export RDS_DB_NAME="iaso"
export USE_S3="false"
export TEST_PROD="true"

./manage.py runserver
