#!/bin/bash
set -e

echo "Log in to Dockerhub"
sudo aws s3 cp s3://iaso-trypelim-docker-login/config.json /root/.docker/config.json
