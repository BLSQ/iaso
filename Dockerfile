FROM python:3.6

################################################################################
# DEFINE VARIABLES
################################################################################

ENV DEBIAN_FRONTEND noninteractive
# Do not buffer stdout so we see log output immediatly
ENV PYTHONUNBUFFERED true
# Taken from: https://github.com/docker-library/python/blob/master/3.6/Dockerfile
# if this is called "PIP_VERSION", pip explodes with "ValueError: invalid truth value '<VERSION>'"
ENV PYTHON_PIP_VERSION 9.0.1
# https://github.com/Yelp/dumb-init/releases
ENV DUMB_INIT 1.2.0
# https://nodejs.org
ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.9.5

################################################################################

COPY build_scripts/apt-packages.txt /tmp/apt-packages.txt
RUN apt-get update -qq && cat /tmp/apt-packages.txt | xargs apt-get -qq --yes --force-yes install
COPY build_scripts/nginx.conf /etc/nginx/sites-available/default

RUN wget https://github.com/Yelp/dumb-init/releases/download/v${DUMB_INIT}/dumb-init_${DUMB_INIT}_amd64.deb
RUN dpkg -i dumb-init_*.deb
RUN rm dumb-init_*.deb

################################################################################
# install nodejs, taken from the official docker nodejs Dockerfile
# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

RUN curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v${NODE_VERSION}-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v${NODE_VERSION}-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt

################################################################################

# Taken from: https://github.com/docker-library/python/blob/master/3.6/Dockerfile
# we use "--force-reinstall" for the case where the version of pip
# we're trying to install is the same as the version bundled with Python
# ("Requirement already up-to-date: pip==8.1.2 in /usr/local/lib/python3.6/site-packages")
# https://github.com/docker-library/python/pull/143#issuecomment-241032683
RUN pip install --quiet --no-cache-dir --upgrade --force-reinstall pip==${PYTHON_PIP_VERSION}

COPY build_scripts/npmrc /root/.npmrc
WORKDIR /opt/app

COPY requirements.txt /opt/app/requirements.txt
RUN pip install --quiet -r requirements.txt

# NODE Deps, JS/CSS production build
ARG NODE_ENV=development
COPY .npmrc /opt/app
COPY package.json /opt/app/package.json
RUN npm install --loglevel silent
RUN rm -f .npmrc
ENV PATH /opt/app/node_modules/.bin:$PATH

# display git commit
ARG git_commit
ENV HAT_COMMIT "$git_commit"

COPY . /opt/app
RUN npm run build

ENTRYPOINT ["/opt/app/entrypoint.sh"]

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
