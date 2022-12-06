FROM node:lts-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

#RUN npm i
RUN yarn install --frozen-lockfile 

COPY . .

ENV LT_url="http://localhost:8080/live/xx-fallback/playlist.m3u8"
ENV LT_connections=100
ENV LT_maxConnectionRequests=3
ENV LT_duration=30

CMD ["node","index.js"]