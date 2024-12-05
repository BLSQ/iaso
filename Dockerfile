# https://hub.docker.com/_/python
FROM ubuntu:24.04

RUN apt-get update && apt-get --yes install \
		curl \
		gettext \
		gettext-base \
		postgresql-client \
		libgdal-dev \
        python3 \
        python3-pip \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /opt/app

# Symlink in order to not break all scripts that use "python"
RUN ln -s /usr/bin/python3 /usr/bin/python

# install python dependencies
COPY requirements.txt /opt/app/requirements.txt
COPY requirements-dev.txt /opt/app/requirements-dev.txt
RUN pip install -r requirements.txt --break-system-packages
RUN pip install -r requirements-dev.txt --break-system-packages

# don't copy app we mount everything afterwards for hot reloading anyway
COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
