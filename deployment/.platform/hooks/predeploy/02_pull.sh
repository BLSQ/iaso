#!/bin/bash
set -e

echo "Going to /var/app/staging..."
cd /var/app/staging

echo "Pulling latest version of the IASO image..."
docker compose pull
