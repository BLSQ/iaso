#TODO: delete me once the new prod image is tested and working
# Do a Docker multistage build where we build the NPM package in an image
# Then transfert it in the filan django image
############ NPM Builder ######################################################################

FROM node:22.18.0-bullseye-slim AS npmbuilder
ENV PROJECT_ROOT=/opt

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    build-essential \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set Python 3 as the default python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json .
COPY package-lock.json .


RUN npm install -g npm@11.19.0

RUN rm -rf node_modules
RUN npm cache clean --force
RUN npm cache verify
# ci install the exact version of package, compared to install which might a bump minor version
RUN npm ci

COPY hat/ /opt/app/hat/
COPY plugins/ /opt/app/plugins
COPY tsconfig.json /opt/app/tsconfig.json
COPY babel-register.js /opt/app/babel-register.js

RUN npm run webpack-prod
RUN ls ./hat/assets

# MCP catalog UI (Vite)
COPY iaso/mcp/frontend/package.json iaso/mcp/frontend/package-lock.json /opt/app/iaso/mcp/frontend/
WORKDIR /opt/app/iaso/mcp/frontend
RUN npm ci
COPY iaso/mcp/frontend/ ./
RUN npm run build
WORKDIR /opt/app


########### Django Builder ########################################################################
FROM python:3.9 AS base

RUN apt-get update && apt-get --yes  --no-install-recommends install \
    gettext \
    gettext-base \
    postgresql-client \
    binutils libproj-dev gdal-bin \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app
COPY pyproject.toml /opt/app/pyproject.toml
RUN pip install uv
# make uv use the system python and install everything in the system, not in a .venv
ENV UV_PROJECT_ENVIRONMENT=/usr/local
ENV UV_PYTHON_PREFERENCE=only-system
ENV UV_NO_DEV=1
RUN uv sync --python "$(which python3)" --group prod

COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets
COPY . /opt/app
COPY --from=npmbuilder /opt/app/iaso/mcp/frontend/dist /opt/app/iaso/mcp/frontend/dist
RUN SECRET_KEY=NOT_SO_SECRET uv run python manage.py collectstatic
RUN SECRET_KEY=NOT_SO_SECRET uv run python manage.py compilemessages

FROM base AS dev
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

FROM base AS prod
USER root

COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets

# Migrations are run by the start_gunicorn
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic --noinput
EXPOSE 8081
ENTRYPOINT ["./entrypoint.sh"]
CMD ["start_gunicorn"]
