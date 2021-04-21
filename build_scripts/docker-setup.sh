#!/bin/bash
set -e
set -x


################################################################################
# define variables
################################################################################

# Do not buffer stdout so we see log output immediatly
export PYTHONUNBUFFERED=true

# A minimal init system for Linux containers
# https://github.com/Yelp/dumb-init/releases
export DUMB_INIT=1.2.0

# https://nodejs.org
export NPM_CONFIG_LOGLEVEL=info
export NODE_VERSION=10.15.0


################################################################################
# install packages
################################################################################

apt-get update -qq
cat /tmp/apt-packages.txt | xargs apt-get -qq --yes --force-yes install


################################################################################
# install nodejs, taken from https://github.com/nodesource/distributions/blob/master/README.md
curl -fsSL https://deb.nodesource.com/setup_10.x | bash -
apt-get install -y nodejs

################################################################################
# cleaning
################################################################################

apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
