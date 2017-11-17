export RDS_DB_NAME="trypelim"
export RDS_USERNAME="sense_hat"
export RDS_PASSWORD="BhEzVaGy2njTjVvrJV)ETw"
export RDS_HOSTNAME="sense-hat-dev-db.cfkkcjedzein.eu-west-1.rds.amazonaws.com"
export RDS_PORT=5432

/usr/local/bin/docker-compose -f docker-compose-dev.yml up
