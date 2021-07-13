#!/usr/bin/env bash

# Use this script if you want to run the IASO (python side) locally outside of Docker
# You can run the database and webpack with django-compose and it will connect to the by default
# By running:  django-compose up db webpack

# You will need to create a venv locally by running: venv . && pip install -r requirements.txt

#source bin/activate
export SECRET_KEY="secret"
export RDS_PORT="5433"
export RDS_HOSTNAME="localhost"
export DEBUG="true"
export CACHE="false"
export DEV_SERVER="true"
export RDS_DB_NAME="iaso"
export USE_S3="false"
export RDS_PASSWORD="postgres"

set  -o allexport
source .env

./manage.py runserver
set  +o allexport
