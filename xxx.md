# SPECTADO HLS Relay server

![GitHub package.json version](https://img.shields.io/github/package-json/v/spectado/spectado-hls-relay?style=for-the-badge)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/spectado/spectado-hls-relay/main?style=for-the-badge)

![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/spectado/spectado-hls-relay?style=for-the-badge)
![Docker Image Version (tag latest semver)](https://img.shields.io/docker/v/spectado/spectado-hls-relay/latest?style=for-the-badge)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/spectado/spectado-hls-relay?style=for-the-badge)

This simple server will fetch any remote or local audio file and will transcode it to live HLS stream. You can even use live stream as a source, making this server for example live HLS transcoder for Icecast server.

The HLS Relay requires ffmpeg binary to be installed on the system. You can download binary using NPN or YARN. Refer the ENV values to setup path to ffmpeg.

```bash
npm run ffmpeg:linux
npm run ffmpeg:win
npm run ffmpeg:macos
```

## Source config

Configuring the sources is as easy as creating one JSON file. This config file is fetched from remote URL and must be hosted on HTTP or HTTPS server.

note: _local config option will be added later_

```json
[
  {
    "id": "stream-static",
    "source": "https://example.com/folder/file.aac"
  },
  {
    "id": "stream-live",
    "source": "https://icecast-server/mountpoint.mp3"
  }
]
```

This config file will produce 2 streams with urls:

```
https://hls-server.tld/live/stream-static/playlist.m3u8
https://hls-server.tld/live/stream-live/playlist.m3u8
```

Server is build to allow dynamic source change with minimal interuptions for the listener.

_This feature is still in development and may not work 100%_

## ENV variables reference

| variable           | default value                            |
| ------------------ | ---------------------------------------- |
| SHLS_HTTP_PORT     | 8080                                     |
| SHLS_HTTPS_PORT    |                                          |
| SHLS_HTTPS_CERT    | /etc/letsencrypt/live/edge/fullchain.pem |
| SHLS_HTTPS_KEY     | /etc/letsencrypt/live/edge/privkey.pem   |
| SHLS_FFMPEGBIN     | ffmpeg                                   |
| SHLS_MEDIAROOT     | /tmp/hls                                 |
| SHLS_CODEC         | aac                                      |
| SHLS_BITRATE       | 64k                                      |
| SHLS_CHANNELS      | 2                                        |
| SHLS_SAMPLERATE    | 44100                                    |
| SHLS_STREAM_SOURCE | https://exemple.com/sources.json         |
| SHLS_LOGLEVEL      | WARNING                                  |

## How to deploy

## 1. Node

Just download latest version and run

```bash
npm install
npm run start
```

You can control settings via .env file or ENV variables on the host. See the full reference of ENV variables bellow.

Please note that HLS relay server will generate lots of small HLS segment files in the /tmp directory. It is recommended to create a RAM disk for those files.

## 2. Docker

You can pass settings via ENV variables, see the reference table bellow.

**IMPORTANT**

There is mount option `--mount type=tmpfs,destination=/tmp,tmpfs-size=2048m` that will mount `/tmp` directory with 2048m size as tmps (stored in memory). This directory is used to store the HLS playlist and HLS segment files.

```bash
docker run \
-d --restart unless-stopped -it \
-p 80:8080 \
--name spectado-hls-relay \
--mount type=tmpfs,destination=/tmp,tmpfs-size=2048m \
--env SHLS_HTTP_PORT=8080 \
--env SHLS_MEDIAROOT=/tmp/hls \
--env SHLS_FFMPEGBIN=ffmpeg \
--env SHLS_STREAM_SOURCE=https://exemple.com/sources.json \
spectado/spectado-hls-relay
```

This server can run on both HTTP and HTTPS. If you want to run with HTTPS enabled, you need to specify port number for HTTPS and also SSL certificates location.

Default mapping for docker is `/etc/letsencrypt` folder, so you can generate and store the cert on your server

```bash
certbot certonly --standalone --cert-name=edge --agree-tos
```

Note the `edge` name of certificate and certificate path in ENV `/etc/letsencrypt/live/edge/fullchain.pem`

```bash
docker run \
-d --restart unless-stopped -it \
-p 443:8443 \
-p 80:8080 \
--name spectado-hls-relay \
--mount type=tmpfs,destination=/tmp,tmpfs-size=2048m \
-v /etc/letsencrypt:/etc/letsencrypt \
--env SHLS_HTTP_PORT=8080 \
--env SHLS_HTTPS_PORT=8443 \
--env SHLS_HTTPS_CERT=/etc/letsencrypt/live/edge/fullchain.pem \
--env SHLS_HTTPS_CERT_KEY=/etc/letsencrypt/live/edge/privkey.pem \
--env SHLS_MEDIAROOT=/tmp/hls \
--env SHLS_FFMPEGBIN=ffmpeg \
--env SHLS_STREAM_SOURCE=https://exemple.com/sources.json \
spectado/spectado-hls-relay
```
