#!/usr/bin/env bash
export RDS_DB_NAME="trypelim"
export RDS_USERNAME="sense_hat"
export RDS_PASSWORD="BhEzVaGy2njTjVvrJV)ETw"
export RDS_HOSTNAME="trypelim.ct6zilwq9jpp.eu-central-1.rds.amazonaws.com"
export COUCHDB_PASSWORD="q>sv2tBYDTcdVDvgipLCDN"
export RDS_PORT="5432"
export AWS_STORAGE_BUCKET_NAME="trypelim"
export AWS_ACCESS_KEY_ID="AKIAJARGLYO4U2IE4TKQ"
export AWS_SECRET_ACCESS_KEY="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"

docker-compose  -f docker-compose-prod.yml down --volumes
