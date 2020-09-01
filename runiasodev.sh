#!/usr/bin/env bash
source bin/activate
export SECRET_KEY="secret"
export RDS_PORT="5433"
export RDS_HOSTNAME="localhost"
export REDIS_PORT="6379"
export REDIS_HOST="localhost"
export DEBUG="true"
export CACHE="false"
export DEV_SERVER="true"
export RDS_DB_NAME="iaso"
export FLAVOR="iaso"

./manage.py runserver