# Do a Docker multistage build where we build the NPM package in an image
# Then transfert it in the filan django image
############ NPM Builder ######################################################################

FROM node:14.17-bullseye-slim as npmbuilder
ENV PROJECT_ROOT /opt

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    python \
    git \
    build-essential \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json .
COPY package-lock.json .

RUN npm install -g npm@8.5.5

RUN rm -rf node_modules
RUN npm cache clean --force
RUN npm cache verify
# ci install the exact version of package, compared to install which might a bump minor version
RUN npm ci

# Install Cypress
RUN npm install cypress --save-dev --no-optional
COPY hat/ /opt/app/hat/
COPY plugins/ /opt/app/plugins
COPY tsconfig.json /opt/app/tsconfig.json
COPY babel-register.js /opt/app/babel-register.js

RUN npm run webpack-prod
RUN ls ./hat/assets


########### Django Builder ########################################################################
FROM python:3.8 as base

RUN apt-get update && apt-get --yes  --no-install-recommends install \
    gettext \
    gettext-base \
    postgresql-client \
    binutils libproj-dev gdal-bin \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app
COPY requirements.txt /opt/app/requirements.txt
COPY requirements-dev.txt /opt/app/requirements-dev.txt
RUN pip install -r requirements.txt
RUN pip install -r requirements-dev.txt

COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets
COPY . /opt/app
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic
RUN SECRET_KEY=NOT_SO_SECRET python manage.py compilemessages

FROM base as dev
# Tell iaso backend to Use the assets build by webpack
# This stage is used by the test_cypres github action. Using --target dev
ENV TEST_PROD=1
# Disable ssl redirect by default
ENV DISABLE_SSL_REDIRECT=1
EXPOSE 8081
ENTRYPOINT ["./entrypoint.sh"]
#CMD ["start"]
# Needed for github action since we can't pass a command directly
CMD ["manage", "testserver", "--no-input", "iaso/fixtures/user.yaml", "--addrport", "0.0.0.0:8081"]

FROM base as prod
USER root
# Only install gunicorn for production
RUN pip install gunicorn
COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets
# Migrations are run by the start_gunicorn
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic --noinput
EXPOSE 8081
ENTRYPOINT ["./entrypoint.sh"]
CMD ["start_gunicorn"]
