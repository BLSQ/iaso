#!/bin/bash
set -euo pipefail


PROD_COMPOSE="docker/prod/docker-compose.prod.yml"
PROD_EB_EXTENSIONS="docker/prod/.ebextensions"
DEV_EB_EXTENSIONS=".ebextensions"
DEV_EB_EXTENSIONS_BAK=".ebextensions.bak"
DEV_COMPOSE="docker-compose.yml"
DEV_COMPOSE_BAK="docker-compose.dev.yml"

EB_ENVIRONMENT="${1}"

if [ -z "$EB_ENVIRONMENT" ]; then
    echo "==> EB_ENVIRONMENT is not set"
    echo "Usage: $0 <environment>"
    exit 1
fi


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
    
    echo "==> Restoring eb extensions for dev..."
    mv "$DEV_EB_EXTENSIONS" "$PROD_EB_EXTENSIONS"
    mv "$DEV_EB_EXTENSIONS_BAK" "$DEV_EB_EXTENSIONS"
    git checkout -- "$DEV_COMPOSE"
    git checkout -- "$DEV_EB_EXTENSIONS"
}

# Swap docker-compose files 
echo "==> Swapping docker-compose to prod"
mv "$DEV_COMPOSE" "$DEV_COMPOSE_BAK"
mv "$PROD_COMPOSE" "$DEV_COMPOSE"

# Swap eb extensions files
echo "==> Swapping eb extensions to prod"
mv "$DEV_EB_EXTENSIONS" "$DEV_EB_EXTENSIONS_BAK"
mv "$PROD_EB_EXTENSIONS" "$DEV_EB_EXTENSIONS"

# Stage the swapped files so `eb deploy --staged` picks it up
git add "$DEV_COMPOSE"
git add "$DEV_EB_EXTENSIONS"

# Rollback even if deploy failed
trap cleanup EXIT

# Create version from tags
VERSION_NAME=$(git describe --tags --match "v[[:digit:]]*")
export "VERSION_NAME=${VERSION_NAME}"
echo "==> Version name/tag ${VERSION_NAME}"

# Deploy to prod
echo "==> Deploying ${EB_ENVIRONMENT}"
python "scripts/eb_deploy.py" "${EB_ENVIRONMENT}"

# Timestamp
date