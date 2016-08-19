FROM python:3.5

# Do not buffer stdout so we see log output immediatly
ENV DEBIAN_FRONTEND noninteractive
ENV PYTHONUNBUFFERED true
ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 4.4.7

ADD build_scripts/apt-packages.txt /tmp/apt-packages.txt
RUN apt-get update -qq && cat /tmp/apt-packages.txt | xargs apt-get -qq --yes --force-yes install
ADD build_scripts/nginx.conf /etc/nginx/sites-available/default

RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64.deb
RUN dpkg -i dumb-init_*.deb
RUN rm dumb-init_*.deb

################################################################################
# install nodejs, taken from:
# https://github.com/nodejs/docker-node/blob/bf93fccf8e127824cd2478f491502c7d3ad0e1aa/4.4/Dockerfile

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

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt

################################################################################

ADD . /opt/app
WORKDIR /opt/app

RUN pip install --quiet --upgrade pip==8.1.2
RUN pip install --quiet -r requirements.txt

# NODE Deps, JS/CSS production build
# NODE_ENV production removes devDependencies after build
ARG NODE_ENV=development
RUN npm install --loglevel silent && npm run build && npm prune
ENV PATH /opt/app/node_modules/.bin:$PATH

# display git commit
ARG git_commit
ENV HAT_COMMIT "$git_commit"

ENTRYPOINT ["/opt/app/entrypoint.sh"]

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
