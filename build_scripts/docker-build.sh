#!/bin/bash
set -e
set -x

TAG=$TRAVIS_TAG
COMMIT=$TRAVIS_COMMIT
BRANCH=$TRAVIS_BRANCH
PR=$TRAVIS_PULL_REQUEST

echo $TAG
echo $BRANCH
echo $PR
export TAG
export BRANCH

if [ -z $TAG ]; then
    echo "No tags, tagging as: $COMMIT"
    TAG=$COMMIT
else
    TAG=$TAG
fi

# if this is on the master/dev branch and is not a PR, deploy it
if [ $PR = "false" ] && [ $BRANCH = "development" -o $BRANCH = "master" -o $BRANCH = "staging" ];
then
  aws ecr get-login --region eu-west-1 | bash

  docker tag sense-hat:latest $DOCKER_IMAGE_REPO/$DOCKER_IMAGE_NAME:$TAG
  docker push $DOCKER_IMAGE_REPO/$DOCKER_IMAGE_NAME:$TAG

  git clone git@github.com:eHealthAfrica/beanstalk-deploy.git .ebextensions/common
  mv .ebextensions/common/* .ebextensions/

  envsubst < build_scripts/Dockerrun.aws.json.tmpl > build_scripts/Dockerrun.aws.json

  zip -FSj build_scripts/deploy.zip build_scripts/Dockerrun.aws.json
  zip -r build_scripts/deploy.zip .ebextensions/

  case "$BRANCH" in
    "master")
      eb deploy hat-historical-prod -l $TAG
    ;;
    "staging")
      eb deploy hat-historical-staging -l $TAG
    ;;
    "development")
      eb deploy hat-historical-dev -l $TAG
    ;;
    *)
    echo "cannot find environment for $BRANCH"
  esac
fi
