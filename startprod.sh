#!/usr/bin/env bash
./set-prod-env.sh
docker-compose  -f docker-compose-prod.yml up 
