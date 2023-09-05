FROM python:3.8

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
RUN pip install --quiet -r requirements.txt
RUN pip install --quiet -r requirements-dev.txt

# don't copy app we mount everything afterwards for hot reloading anyway
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
