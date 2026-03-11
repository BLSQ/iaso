# ── Stage 1: JS / webpack build ───────────────────────────────────────────────
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

RUN npm run webpack-prod

# ── Stage 2: Python dependency builder ────────────────────────────────────────
# Full Bullseye image to compile C extensions (GDAL, Shapely, psycopg2…).
# Only the resulting /venv is carried forward.
FROM python:3.9-bullseye AS pybuilder

WORKDIR /opt/app

RUN apt-get update && apt-get install --yes --no-install-recommends \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# ── Stage 3: Production image ─────────────────────────────────────────────────
# Slim image with runtime-only libraries.
FROM python:3.9-slim-bullseye AS prod

# Runtime-only dependencies:
#  - libgdal28: GDAL shared library (runtime, no headers)
#  - libpq5: PostgreSQL client library (for psycopg2)
#  - postgresql-client: psql CLI (used in wait_for_dbs.sh)
#  - gettext-base: envsubst (used for config templating)
#  - gettext: compilemessages needs msgfmt at build, but also useful at runtime
RUN apt-get update && apt-get install --yes --no-install-recommends \
    libgdal28 \
    libpq5 \
    postgresql-client \
    gettext \
    gettext-base \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtualenv from builder
COPY --from=pybuilder /venv /venv
ENV PATH="/venv/bin:$PATH"
ENV VIRTUAL_ENV="/venv"

WORKDIR /opt/app

# Copy webpack assets
COPY --from=npmbuilder /opt/app/hat/assets /opt/app/hat/assets

# Copy project code
COPY hat ./hat
COPY iaso ./iaso
COPY setuper ./setuper
COPY beanstalk_worker ./beanstalk_worker
COPY django_sql_dashboard_export ./django_sql_dashboard_export
COPY plugins ./plugins
COPY scripts ./scripts
COPY README.md manage.py entrypoint.sh tsconfig.json babel-register.js mypy.ini pyproject.toml ./
# test data and notebooks
COPY testdata ./testdata
COPY notebooks /opt/notebooks

# Collect static files and compile translations
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic --noinput && \
    SECRET_KEY=NOT_SO_SECRET python manage.py compilemessages

# Non-root user: compatible with k8s runAsNonRoot
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser && \
    chown -R appuser:appuser /opt/app

USER appuser

EXPOSE 8081

ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD ["start_gunicorn"]
