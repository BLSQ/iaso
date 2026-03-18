# ── Stage 1: JS / webpack build ───────────────────────────────────────────────
FROM node:22.18.0-bullseye-slim AS npmbuilder

# Set environment variables
ENV PROJECT_ROOT=/opt
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set working directory
WORKDIR /opt/app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install -g npm@10.9.3 && \
    rm -rf node_modules && \
    npm cache clean --force && \
    npm ci

# Copy project code
COPY hat/ ./hat/
COPY plugins/ ./plugins/

# Copy webpack configuration files
COPY tsconfig.json babel-register.js ./

# Build webpack assets
RUN npm run webpack-prod

# ── Stage 2: Python dependency builder ────────────────────────────────────────
# Full Bullseye image to compile C extensions
# Only the resulting /venv is carried forward.
FROM python:3.9-bullseye AS pybuilder

# Set working directory
WORKDIR /opt/app

# Install system dependencies
RUN apt-get update && apt-get install --yes --no-install-recommends \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Install python dependencies + gunicorn
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Strip the venv: remove caches and debug symbols
RUN find /venv -type d -name "__pycache__" -exec rm -rf {} + && \
    find /venv -type f -name "*.pyc" -delete && \
    find /venv -type f -name "*.pyo" -delete && \
    find /venv -type f -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find /venv -type f -name "*.so" -exec strip --strip-debug {} + 2>/dev/null || true

# ── Stage 3: Production image ─────────────────────────────────────────────────
# Slim image with runtime-only libraries.
FROM python:3.9-slim-bullseye AS prod

# Create non-root user early so COPY --chown can use it (avoids chown layer duplication)
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

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
COPY --from=pybuilder --chown=appuser:appuser /venv /venv
ENV PATH="/venv/bin:$PATH"
ENV VIRTUAL_ENV="/venv"

WORKDIR /opt/app

# Copy webpack assets
COPY --from=npmbuilder --chown=appuser:appuser /opt/app/hat/assets /opt/app/hat/assets

# Copy project code (all owned by appuser, no separate chown layer needed)
COPY --chown=appuser:appuser hat ./hat
COPY --chown=appuser:appuser iaso ./iaso
COPY --chown=appuser:appuser setuper ./setuper
COPY --chown=appuser:appuser beanstalk_worker ./beanstalk_worker
COPY --chown=appuser:appuser django_sql_dashboard_export ./django_sql_dashboard_export
COPY --chown=appuser:appuser plugins ./plugins
COPY --chown=appuser:appuser scripts ./scripts
COPY --chown=appuser:appuser README.md manage.py entrypoint.sh tsconfig.json babel-register.js pyproject.toml ./

# Create dir for uploaded files
RUN mkdir media && chown appuser:appuser media

# Collect static files, compile translations
RUN SECRET_KEY=NOT_SO_SECRET python manage.py collectstatic --noinput && \
    SECRET_KEY=NOT_SO_SECRET python manage.py compilemessages

# Update permissions on collected static files
RUN chown -R appuser:appuser ./static

# Switch to non-root user
USER appuser

EXPOSE 8081

ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD ["start_gunicorn"]
