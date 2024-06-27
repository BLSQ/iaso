#!/bin/bash
# This script is used during deployement to fill the version info so we can see them from python
BRANCH_NAME=$(echo $BUILD_SOURCEBRANCH | sed 's#refs/heads/##')


# Determine the branch name from different CI environments
if [ -n "$BUILD_SOURCEBRANCH" ]; then
    BRANCH_NAME=$(echo $BUILD_SOURCEBRANCH | sed 's#refs/heads/##')
elif [ -n "$GITHUB_REF" ]; then
    BRANCH_NAME=$(echo $GITHUB_REF | sed 's#refs/heads/##')
else
    BRANCH_NAME="unknown"
fi

echo $BRANCH_NAME

# Determine the user who triggered the deployment
if [ -n "$BUILD_REQUESTEDFOR" ]; then
    DEPLOYED_BY=$BUILD_REQUESTEDFOR
elif [ -n "$GITHUB_ACTOR" ]; then
    DEPLOYED_BY=$GITHUB_ACTOR
else
    DEPLOYED_BY="unknown"
fi

echo $DEPLOYED_BY

cat > hat/__version__.py << EOF
# Generated at deploy
VERSION="$(git describe --tags)--$BRANCH_NAME"
DEPLOYED_ON="$(date --rfc-3339=seconds)"
DEPLOYED_BY="$DEPLOYED_BY"
EOF

cat hat/__version__.py
