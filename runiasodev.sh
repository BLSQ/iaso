#!/usr/bin/env bash

# Use this script if you want to run the IASO (python side) locally outside of Docker
# you will have to provide the DB

source bin/activate
export SECRET_KEY="secret"
export RDS_PORT="5433"
export RDS_HOSTNAME="localhost"
export DEBUG="true"
export CACHE="false"
export DEV_SERVER="true"
export RDS_DB_NAME="iaso"
export USE_S3="false"
export RDS_PASSWORD="postgres"

./manage.py runserver
