#!/bin/bash
set -e

echo "Log in to Dockerhub"
aws s3 cp s3://iaso-docker-login/config.json ~/.docker/config.json
