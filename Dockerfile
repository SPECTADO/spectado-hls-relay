FROM node:lts-slim

ARG BUILD_DATE
ARG VCS_REF

LABEL org.label-schema.build-date="${BUILD_DATE}" \
    org.label-schema.name="spectado-hls-relay" \
    org.label-schema.vendor="SPECTADO" \
    org.label-schema.version="1.0.0"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i
RUN mkdir ./bin
RUN npm run ffmpeg:linux

COPY . .

ENV HTTP_PORT=8080
ENV HTTPS_PORT=
ENV HTTPS_CERT="/tmp-cert/fullchain.pem"
ENV HTTPS_CERT_KEY="/tmp-cert/privkey.pem"
ENV TEMP="/tmp"
ENV STREAM_SOURCE="https://api-livesport.play.cz/edgeStreams"

EXPOSE 8080 8443

CMD ["node","index.js"]