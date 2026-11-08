# https://hub.docker.com/_/python
FROM python:3.9

RUN apt-get update && apt-get --yes install \
	curl \
	gettext \
	gettext-base \
	postgresql-client \
	libgdal-dev \
    ca-certificates \
	&&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# odk_cli (https://github.com/BLSQ/odk_cli, private): builds and edits a submission's XML from its answers as ODK
# Collect would (`iaso.odk.instance_editor`, used by /api/submissions/). Its release binary, published on S3, checked
# against the checksum pinned here - same URL and checksum in docker/django/Dockerfile and docker/prod/Dockerfile.
# linux/amd64 only: elsewhere, /api/submissions/ answers 503.
ARG ODK_CLI_URL=https://blsq-io.s3.eu-west-1.amazonaws.com/odk-cli/1.0.2/odk_cli-linux-amd64
ARG ODK_CLI_SHA256=eee7d3ba8d3de3f54d1e21bbcb51e1f30cf711c681dc331d54908efeec618bcf
RUN if [ "$(dpkg --print-architecture)" = "amd64" ]; then \
        curl -fsSL -o /usr/local/bin/odk_cli "${ODK_CLI_URL}" \
        && echo "${ODK_CLI_SHA256}  /usr/local/bin/odk_cli" | sha256sum -c - \
        && chmod +x /usr/local/bin/odk_cli; \
    else \
        echo "odk_cli: no $(dpkg --print-architecture) binary, /api/submissions/ will answer 503"; \
    fi

WORKDIR /opt/app

# install python dependencies
COPY pyproject.toml /opt/app/pyproject.toml

# install pinned uv version
COPY --from=ghcr.io/astral-sh/uv:0.13.4 /uv /uvx /bin/

# make uv use the system python and install everything in the system, not in a .venv
ENV UV_PROJECT_ENVIRONMENT=/usr/local
ENV UV_PYTHON_PREFERENCE=only-system
RUN uv sync --python "$(which python3)"

# preinstall the duckdb extensions, otherwise downloaded in every new container (~5 s, see the script)
COPY scripts/install_duckdb_extensions.py /opt/app/scripts/install_duckdb_extensions.py
RUN python scripts/install_duckdb_extensions.py

# Uncomment to debug snt-malaria budgeting
# ENV PYTHONPATH="/opt/snt-malaria-budgeting:${PYTHONPATH}"

# don't copy app we mount everything afterwards for hot reloading anyway
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
