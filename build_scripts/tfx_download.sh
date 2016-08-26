#!/bin/bash
set -e
set -o nounset

# Strings for Django
target="hat/locale/fr/LC_MESSAGES"
mkdir -p "$target"

url="https://www.transifex.com/api/2/project/hat/resource/sense-hat-historicalpo/translation/fr?file=true"
curl -L --user "$TRANSIFEX_USER:$TRANSIFEX_PASSWORD" -X GET "$url" > "$target/django.po"

# Strings for React frontent
target_js="hat/assets/js/translations"
mkdir -p "$target"

url="https://www.transifex.com/api/2/project/hat/resource/sense-hat-dashboard-en/translation/fr?file=true"
curl -L --user "$TRANSIFEX_USER:$TRANSIFEX_PASSWORD" -X GET "$url" > "$target_js/fr.json"

# compile messages for django
docker-compose run web manage compilemessages -l fr
