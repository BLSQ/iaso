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

if [ -z $TAG ]; then
    echo "No tags, tagging as: $COMMIT"
    TAG=$COMMIT
else
    TAG=$TAG
fi

# if this is on the master/dev branch and is not a PR, deploy it
if [ $PR = "false" ] #&& [ $BRANCH = "development" -o $BRANCH = "master" -o $BRANCH = "staging" ];
then
  aws ecr get-login --region eu-west-1 | bash

  docker tag django:latest $DOCKER_IMAGE_REPO/$DOCKER_IMAGE_NAME:$TAG 
  docker push $DOCKER_IMAGE_REPO/$DOCKER_IMAGE_NAME:$TAG

  envsubst < build_scripts/Dockerrun.aws.json.tmpl > build_scripts/Dockerrun.aws.json

  case "$BRANCH" in
    "master")
      zip -FSj build_scripts/deploy.zip build_scripts/Dockerrun.aws.json
      zip -r build_scripts/deploy.zip .ebextensions/
      eb deploy hat-historical-prod -l $TAG
    ;;
    "staging")
      zip -FSj build_scripts/deploy.zip build_scripts/Dockerrun.aws.json
      zip -r build_scripts/deploy.zip .ebextensions/
      eb deploy hat-historical-staging -l $TAG
    ;;
    "development")
      zip -FSj build_scripts/deploy.zip build_scripts/Dockerrun.aws.json
      zip -r build_scripts/deploy.zip .ebextensions/
      eb deploy hat-historical-dev -l $TAG
    ;;
    *)
    echo "cannot find environment for $BRANCH"
  esac
fi
