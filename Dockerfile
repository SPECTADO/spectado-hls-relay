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

COPY . .

ENV HTTP_PORT=8080
ENV HTTPS_PORT=
ENV HTTPS_CERT="/tmp-cert/fullchain.pem"
ENV HTTPS_CERT_KEY="/tmp-cert/privkey.pem"
ENV FFMPEGBIN="./bin/ffmpeg"
ENV MEDIAROOT="/tmp/hls"
ENV STREAM_SOURCE="https://domain.tld/sources.json"

EXPOSE 8080 8443

CMD ["node","src/index.js"]