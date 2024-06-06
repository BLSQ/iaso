FROM node:20.13.1-bullseye-slim

ENV PROJECT_ROOT /opt
WORKDIR /opt/app

# Install system dependencies including Python 3
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set Python 3 as the default python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json .
COPY package-lock.json .

# Upgrade npm to the latest version compatible with Node.js 20.13.1
RUN npm install -g npm@10.5.2

# Install project dependencies
RUN npm ci

ENTRYPOINT ["./entrypoint.sh"]