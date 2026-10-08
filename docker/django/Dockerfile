# https://hub.docker.com/_/python
FROM python:3.9

RUN apt-get update && apt-get --yes install \
	curl \
	gettext \
	gettext-base \
	postgresql-client \
	libgdal-dev \
	&&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# odk_cli (https://github.com/BLSQ/odk_cli, private): JavaRosa, the form engine of ODK Collect and of the IASO app, as
# a native binary. Fills and checks the forms of entity workflow scenarios (`iaso.scenarios.form_engine`). Its release
# binary, published on S3, checked against the checksum pinned here - same URL and checksum in docker/django/Dockerfile
# and docker/prod/Dockerfile. v1.0.0 (commit 3f50e1b). linux/amd64 only: elsewhere, scenarios can't fill forms.
ARG ODK_CLI_URL=https://blsq-io.s3.eu-west-1.amazonaws.com/odk-cli/odk_cli-linux-amd64
ARG ODK_CLI_SHA256=468532d367706da54a443c84e551efd4e60cd8fa3a506144e4475603b8747fca
RUN if [ "$(dpkg --print-architecture)" = "amd64" ]; then \
        curl -fsSL -o /usr/local/bin/odk_cli "${ODK_CLI_URL}" \
        && echo "${ODK_CLI_SHA256}  /usr/local/bin/odk_cli" | sha256sum -c - \
        && chmod +x /usr/local/bin/odk_cli; \
    else \
        echo "odk_cli: no $(dpkg --print-architecture) binary, submissions' answers can't be edited"; \
    fi

WORKDIR /opt/app

# install python dependencies
COPY pyproject.toml /opt/app/pyproject.toml
RUN pip install uv
# make uv use the system python and install everything in the system, not in a .venv
ENV UV_PROJECT_ENVIRONMENT=/usr/local
ENV UV_PYTHON_PREFERENCE=only-system
RUN uv sync --python "$(which python3)"

# Uncomment to debug snt-malaria budgeting
# ENV PYTHONPATH="/opt/snt-malaria-budgeting:${PYTHONPATH}"

# don't copy app we mount everything afterwards for hot reloading anyway
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
