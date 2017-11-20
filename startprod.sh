#!/usr/bin/env bash
export RDS_DB_NAME="trypelim"
export RDS_USERNAME="sense_hat"
export RDS_PASSWORD="BhEzVaGy2njTjVvrJV)ETw"
export RDS_HOSTNAME="trypelim.ct6zilwq9jpp.eu-central-1.rds.amazonaws.com"
export COUCHDB_PASSWORD="q>sv2tBYDTcdVDvgipLCDN"RDS_PORT="5432"

docker-compose  -f docker-compose-prod.yml up
