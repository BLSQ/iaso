#!/bin/bash
set -euo pipefail


PROD_COMPOSE="docker/prod/docker-compose.prod.yml"
DEV_COMPOSE="docker-compose.yml"
DEV_COMPOSE_BAK="docker-compose.dev.yml"

EB_ENVIRONMENT="${1}"


echo "

 ___    _    ____   ___
|_ _|  / \  / ___| / _ \\
 | |  / _ \ \___ \| | | |
 | | / ___ \ ___) | |_| |
|___/_/   \_\____/ \___/
------------------------
Deploying to ${EB_ENVIRONMENT}
$(date)
"

cleanup() {
    echo "==> Restoring docker-compose for dev..."
    mv "$DEV_COMPOSE" "$PROD_COMPOSE"
    mv "$DEV_COMPOSE_BAK" "$DEV_COMPOSE"
    git checkout -- "$DEV_COMPOSE"
}

# Swap docker-compose files 
echo "==> Swapping docker-compose to prod"
mv "$DEV_COMPOSE" "$DEV_COMPOSE_BAK"
mv "$PROD_COMPOSE" "$DEV_COMPOSE"

# Stage the swapped file so `eb deploy --staged` picks it up
git add "$DEV_COMPOSE"

# Rollback even if deploy failed
trap cleanup EXIT

# Create version from tags
export VERSION_NAME=$(git describe --tags --match "v[[:digit:]]*")
echo "==> Version name/tag ${VERSION_NAME}"

# Deploy to prod
echo "==> Deploying ${EB_ENVIRONMENT}"
python "scripts/eb_deploy.py" "${EB_ENVIRONMENT}"

# Timestamp
date