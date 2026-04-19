FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8009

CMD ["npm", "run", "dev"]
