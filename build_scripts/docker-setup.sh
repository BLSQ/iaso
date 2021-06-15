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

################################################################################
# install packages
################################################################################

apt-get update -qq
cat /tmp/apt-packages.txt | xargs apt-get -qq --yes --force-yes install

################################################################################
# cleaning
################################################################################

apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
