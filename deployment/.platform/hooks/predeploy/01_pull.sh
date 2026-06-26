#!/bin/bash
set -e

echo "Log in to Dockerhub"
aws s3 cp s3://iaso-docker-login/config.json ~/.docker/config.json

echo "Going to /var/app/staging..."
cd /var/app/staging

echo "Pulling latest version of the IASO image..."
docker compose pull
