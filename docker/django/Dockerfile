# https://hub.docker.com/_/python
FROM python:3.9

RUN apt-get update && apt-get --yes install \
	curl \
	gettext \
	gettext-base \
	postgresql-client \
	libgdal-dev \
	&&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app

# install python dependencies
COPY pyproject.toml /opt/app/pyproject.toml
# uv 0.13.4 drops the compromised emSign root. pip 26.2.2 has the same
# fix but requires Python >=3.10, and this image is Python 3.9.
RUN pip install "uv==0.13.4"
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
