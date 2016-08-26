#!/bin/bash
set -e
set -o nounset

BRANCH=$TRAVIS_BRANCH
PR=$TRAVIS_PULL_REQUEST

# upload translations from dev branch only
if [ $PR != "false" ] || [ $BRANCH != "development" ];
then
  echo "Not uploading from $BRANCH or $PR"
  exit 0
fi

# create english language file for upload
docker-compose run web manage makemessages -l en

# upload
url="https://www.transifex.com/api/2/project/hat/resource/sense-hat-historicalpo/content"
curl -i -L --user "$TRANSIFEX_USER:$TRANSIFEX_PASSWORD" -F file=@./hat/locale/en/LC_MESSAGES/django.po -X PUT "$url"

# Upload JS strings (creating in npm run build)
url="https://www.transifex.com/api/2/project/hat/resource/sense-hat-dashboard-en/content"
curl -i -L --user "$TRANSIFEX_USER:$TRANSIFEX_PASSWORD" -F file=@./hat/assets/js/translations/en.json -X PUT "$url"
