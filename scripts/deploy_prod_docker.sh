#!/bin/bash
set -euo pipefail


PROD_COMPOSE="docker/prod/docker-compose.prod.yml"
PROD_PLATFORM="docker/prod/.platform"
DEV_PLATFORM=".platform"
DEV_PLATFORM_BAK=".platform.bak"
DEV_COMPOSE="docker-compose.yml"
DEV_COMPOSE_BAK="docker-compose.dev.yml"
DEV_EB_EXTENSIONS=".ebextensions"
DEV_EB_EXTENSIONS_BAK=".ebextensions.bak"
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
    mv "$DEV_EB_EXTENSIONS_BAK" "$DEV_EB_EXTENSIONS"

    echo "==> Restoring platform hooks for dev..."
    if [ -d "$DEV_PLATFORM" ]; then
        mv "$DEV_PLATFORM" "$PROD_PLATFORM"
    fi
    if [ -d "$DEV_PLATFORM_BAK" ]; then
        mv "$DEV_PLATFORM_BAK" "$DEV_PLATFORM"
    fi

    echo "==> Unstaging swapped files..."
    git reset HEAD -- "$DEV_COMPOSE" "$DEV_PLATFORM" "$DEV_EB_EXTENSIONS"
}

# Set trap early so any failure after this point triggers cleanup
trap cleanup EXIT

# Swap docker-compose files
echo "==> Swapping docker-compose to prod"
mv "$DEV_COMPOSE" "$DEV_COMPOSE_BAK"
mv "$PROD_COMPOSE" "$DEV_COMPOSE"

# Hide dev eb extensions (no prod ebextensions needed)
echo "==> Hiding dev eb extensions"
mv "$DEV_EB_EXTENSIONS" "$DEV_EB_EXTENSIONS_BAK"

# Swap platform hooks
echo "==> Swapping platform hooks to prod"
if [ -d "$DEV_PLATFORM" ]; then
    mv "$DEV_PLATFORM" "$DEV_PLATFORM_BAK"
fi
mv "$PROD_PLATFORM" "$DEV_PLATFORM"

# Stage the swapped files so `eb deploy --staged` picks it up
git add "$DEV_COMPOSE"
git add "$DEV_PLATFORM"
# Stage removal of dev ebextensions so they're excluded from the bundle
git rm -r --cached --quiet "$DEV_EB_EXTENSIONS"

# Create version from tags
VERSION_NAME=$(git describe --tags --match "v[[:digit:]]*")
export "VERSION_NAME=${VERSION_NAME}"
echo "==> Version name/tag ${VERSION_NAME}"

# Deploy to prod
echo "==> Deploying ${EB_ENVIRONMENT}"
python "scripts/eb_deploy.py" "${EB_ENVIRONMENT}"

# Timestamp
date

# If you're migrating to Docker, and you get this error:
# Invalid option specification (Namespace: 'aws:elasticbeanstalk:environment:proxy:staticfiles', OptionName: '/static'): Unknown configuration setting.
# This one means that the django.config from .ebextensions already created the static files config, so we need to remove it from the environment.
# Run this command to remove it:
# aws elasticbeanstalk update-environment --environment-name "${EB_ENVIRONMENT}" --options-to-remove Namespace=aws:elasticbeanstalk:environment:proxy:staticfiles,OptionName=/static