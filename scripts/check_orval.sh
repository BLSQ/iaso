#!/bin/sh
set -e

python manage.py generate_openapi_schema -f test-orval-openapi.json
ORVAL_TARGET_FILE=test-orval-openapi.json npm run orval

if [ -n "$(git status --porcelain ./hat/assets/js/apps/Iaso/api)" ]; then
  echo "API client is not up to date. Run generation locally."
  exit 1
fi