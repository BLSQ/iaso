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

wget https://github.com/Yelp/dumb-init/releases/download/v${DUMB_INIT}/dumb-init_${DUMB_INIT}_amd64.deb
dpkg -i dumb-init_*.deb
rm dumb-init_*.deb

# Add postgres apt repo to get more recent postgres versions
echo 'deb http://apt.postgresql.org/pub/repos/apt/ jessie-pgdg main' > /etc/apt/sources.list.d/pgdg.list
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

apt-get update -qq
cat /tmp/apt-packages.txt | xargs apt-get -qq --yes --force-yes install


################################################################################
# install nodejs, taken from the official docker nodejs Dockerfile

# gpg keys listed at https://github.com/nodejs/node#release-team
for key in \
    56730D5401028683275BD23C23EFEFE93C4CFFFE \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
  ; do \
    gpg --no-tty --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --no-tty --keyserver ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --no-tty --keyserver pgp.mit.edu                --recv-keys "$key" || \
    gpg --no-tty --keyserver keyserver.pgp.com          --recv-keys "$key" ; \
  done

curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt.asc"
gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc
grep " node-v${NODE_VERSION}-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c -
tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1
rm "node-v${NODE_VERSION}-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt


################################################################################
# cleaning
################################################################################

apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
