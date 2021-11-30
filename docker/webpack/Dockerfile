FROM node:14.17.0-stretch-slim
ENV PROJECT_ROOT /opt

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    python \
    git \
    build-essential \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY babel-register.js .
# COPY .babelrc .

# ci install the exact version of package, compared to install which might a bump minor version
RUN npm install -g npm@7
RUN npm ci

ENTRYPOINT ["./entrypoint.sh"]
