FROM node:14-bullseye-slim
ENV PROJECT_ROOT /opt

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    python \
    git \
    build-essential \
    &&  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json .
COPY package-lock.json .


# ci install the exact version of package, compared to install which might a bump minor version
RUN npm install -g npm@8.5
RUN npm ci

ENTRYPOINT ["./entrypoint.sh"]
