# ── Stage 1: JS / webpack build ───────────────────────────────────────────────
# From docker/webpack/Dockerfile
FROM node:22.18.0-bullseye-slim AS npmbuilder

ENV PROJECT_ROOT=/opt 
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install -g npm@10.9.3 && \
    rm -rf node_modules && \
    npm cache clean --force && \
    npm ci

COPY hat/ ./hat/
COPY plugins/ ./plugins/
COPY tsconfig.json babel-register.js ./

RUN ls -lah /opt/app/hat

RUN npm run webpack-prod

# ── Stage 2: Python dependency builder ───────────────────────────────────────
# Full Bullseye image needed to compile C extensions (GDAL, Shapely, psycopg2…).
# https://hub.docker.com/layers/library/python/3.9-bullseye
# Only the resulting /venv is carried forward
FROM python:3.9 AS base

RUN apt-get update && apt-get --yes install \
	curl \
	gettext \
	gettext-base \
	postgresql-client \
	libgdal-dev \
	&&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app

# install python dependencies
COPY requirements.txt /opt/app/requirements.txt
COPY requirements-dev.txt /opt/app/requirements-dev.txt
RUN pip install -r requirements-dev.txt

# Copy the webpack assets
COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets
COPY . /opt/app
# Collect static files
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic
# Compile translations
RUN SECRET_KEY=NOT_SO_SECRET python manage.py compilemessages

# Non-root user: compatible with k8s runAsNonRoot
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

# Change ownership of the project to the appuser
RUN chown -R appuser:appuser /opt/app

########################## # Production image
FROM base AS prod

# Change working directory to the project root
WORKDIR /opt/app

# Switch to non-root user
USER appuser

# Only install gunicorn for production
RUN pip install gunicorn
COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets

# Migrations are run by the start_gunicorn
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic --noinput

EXPOSE 8081

RUN ls -lah /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD ["start_gunicorn"]
