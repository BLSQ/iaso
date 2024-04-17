#!/bin/bash
# This script is used during deployement to fill the version info so we can see them from python
BRANCH_NAME=$(echo $BUILD_SOURCEBRANCH | sed 's#refs/heads/##')
echo $BRANCH_NAME
cat > hat/__version__.py << EOF
# Generated at deploy
VERSION="$(git describe --tags)--$BRANCH_NAME"
DEPLOYED_ON="$(date --rfc-3339=seconds)"
DEPLOYED_BY="$(git log --format='%an' -n 1 "$BUILD_SOURCEVERSION")"
EOF

cat hat/__version__.py
