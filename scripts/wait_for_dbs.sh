#!/bin/bash
set -e

# Simple script to wait for DBs to have been started

until psql -h "db" -U "postgres" -c '\l' > /dev/null; do
  >&2 echo "Waiting for postgres..."
  sleep 1
done

until curl -s "http://couchdb:5984" > /dev/null; do
  >&2 echo "Waiting for couchdb..."
  sleep 1
done
