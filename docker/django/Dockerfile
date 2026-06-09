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
RUN pip install uv
ENV UV_PYTHON_PREFERENCE=only-system
RUN uv sync --python "$(which python3)"

# Uncomment to debug snt-malaria budgeting
# ENV PYTHONPATH="/opt/snt-malaria-budgeting:${PYTHONPATH}"

# don't copy app we mount everything afterwards for hot reloading anyway
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
