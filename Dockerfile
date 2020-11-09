FROM python:3.6

################################################################################
# define variables
################################################################################

ARG NODE_ENV=development

# display git commit
ARG git_commit
ENV HAT_COMMIT "$git_commit"

################################################################################


################################################################################
## setup container
################################################################################

COPY build_scripts/docker-setup.sh build_scripts/apt-packages.txt /tmp/

RUN /tmp/docker-setup.sh

COPY build_scripts/nginx.conf /etc/nginx/sites-available/default

################################################################################


################################################################################
## install app
## copy files one by one and split commands to use docker cache
################################################################################

WORKDIR /opt/app

COPY requirements.txt /opt/app/requirements.txt
RUN pip install --quiet -r requirements.txt

# NODE Deps, JS/CSS production build
COPY package.json /opt/app/package.json
RUN npm install --loglevel silent

ENV PATH /opt/app/node_modules/.bin:$PATH

COPY . /opt/app
RUN npm run build

ENV PATH /opt/app/node_modules/.bin:$PATH
ENTRYPOINT ["/opt/app/entrypoint.sh"]
