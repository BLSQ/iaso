FROM python:3.8

################################################################################
## setup container
################################################################################

COPY build_scripts/docker-setup.sh build_scripts/apt-packages.txt /tmp/

RUN /tmp/docker-setup.sh

################################################################################
## install app
## copy files one by one and split commands to use docker cache
################################################################################

WORKDIR /opt/app

COPY requirements.txt /opt/app/requirements.txt
RUN pip install --quiet -r requirements.txt

# don't copy app we mount everything afterwards
#COPY . /opt/app

ENTRYPOINT ["/opt/app/entrypoint.sh"]
