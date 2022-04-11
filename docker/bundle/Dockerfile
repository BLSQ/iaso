# Do a Docker multistage build where we build the NPM package in an image
# Then transfert it in the filan django image
############ NPM Builder ######################################################################

FROM node:14.17.0-stretch-slim as npmbuilder
ENV PROJECT_ROOT /opt

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    python \
    git \
    build-essential \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json .
COPY package-lock.json .


# ci install the exact version of package, compared to install which might a bump minor version
RUN npm install -g npm@7
RUN npm ci

COPY hat/ /opt/app/hat/
COPY plugins/ /opt/app/plugins
COPY plugins/ /opt/app/plugins
COPY tsconfig.json /opt/app/tsconfig.json
COPY babel-register.js /opt/app/babel-register.js

RUN npm run webpack-prod
RUN ls ./hat/assets


########### Django Builder ########################################################################
FROM python:3.6

RUN apt-get update && apt-get --yes  --no-install-recommends install \
		curl \
		gettext \
		gettext-base \
		postgresql-client \
		libgdal-dev \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app
COPY requirements.txt /opt/app/requirements.txt
RUN pip install -r requirements.txt

COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets
COPY . /opt/app
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic
RUN SECRET_KEY=NOT_SO_SECRET python manage.py compilemessages

ENTRYPOINT ["./entrypoint.sh"]
