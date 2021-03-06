FROM python:3.6

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
RUN pip install --quiet -r requirements.txt

# don't copy app we mount everything afterwards for hot reloading anyway
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
