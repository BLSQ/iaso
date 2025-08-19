# https://hub.docker.com/_/python
FROM python:3.9

# Install GDAL and other dependencies
RUN apt-get update && apt-get --yes install \
    curl \
    gettext \
    gettext-base \
    postgresql-client \
    libgdal-dev \
    gdal-bin \
    python3-dev \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set environment variables for GDAL – this is critical for building Fiona
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
RUN export GDAL_VERSION=$(gdal-config --version)

WORKDIR /opt/app

# Install Python dependencies
COPY requirements.txt /opt/app/requirements.txt
COPY requirements-dev.txt /opt/app/requirements-dev.txt

# Make sure GDAL version is available for pip
RUN GDAL_VERSION=$(gdal-config --version) pip install -r requirements-dev.txt

# Don't copy app – mount it later for hot reloading
# COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
