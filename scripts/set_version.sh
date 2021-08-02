#!/bin/bash
# This script is used during deployement to fill the version info so we can see them from python
cat > hat/__version__.py << EOF
# Generated at deploy
VERSION='$(git branch --show-current)-$(git rev-parse --short HEAD)'
DEPLOYED_ON="$(date --rfc-3339=seconds)"
DEPLOYED_BY="$GITHUB_ACTOR"
EOF
