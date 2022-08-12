FROM node:lts-slim

ARG BUILD_DATE
ARG VCS_REF

LABEL org.label-schema.build-date="${BUILD_DATE}" \
    org.label-schema.name="spectado-hls-relay" \
    org.label-schema.vendor="SPECTADO" \
    org.label-schema.version="1.0.10"

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

#RUN npm i
RUN yarn install --frozen-lockfile 

COPY . .

ENV SHLS_HTTP_PORT=8080
ENV SHLS_HTTPS_PORT=
ENV SHLS_HTTPS_CERT="/tmp-cert/fullchain.pem"
ENV SHLS_HTTPS_CERT_KEY="/tmp-cert/privkey.pem"
ENV SHLS_FFMPEGBIN="./bin/ffmpeg"
ENV SHLS_MEDIAROOT="/tmp/hls"
ENV SHLS_CODEC="aac"
ENV SHLS_BITRATE="64k"
ENV SHLS_CHANNELS=2
ENV SHLS_SAMPLERATE=44100
ENV SHLS_STREAM_SOURCE="https://domain.tld/sources.json"

EXPOSE 8080 8443

CMD ["node","src/index.js"]