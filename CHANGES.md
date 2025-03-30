# HLS Relay server

## 1.6.1

- experimental CDN upload

## 1.5

- experimental pre-roll support
- experimental pre-roll GEO restrictions
- new env variables - SHLS_ALLOWED_PROJECTS & SHLS_GEOIP
- handling of incompatible pre-roll spot file (duration=0)
- pre-roll stats

## 1.4

- m3u8 playlist MIME type fix
- stripping all metadata from source when building HLS segments
- pre-roll spot injection (test)

## 1.3.5

- support for the new stats

## 1.3.1

- preroll test
- support for "fs_project" query param for segmentations of stats

## 1.3.0

- added listeners count per stream
- preroll spot test on xx-fallback stream

## 1.2.3

- added mrtg specific API endpoints for better external monitoring

## 1.2.2

- fixed listeners count (server) to count only connected listeners

## 1.2.0

- multi-core support for running express web server
- can handle much greater load

## 1.1.2

- Fixed bug (warning in logs) when no User-Agent string is present

## 1.1.1

- Tweaked eth & load stats

## 1.1.0

- Support for audio normalization

## 1.0.18

- fixed critical error in countStats function that can cause server to crash

## 1.0.17

- ffmpeg params tweak - lower source latency
- updated ffmpeg binary

## 1.0.15

- stability fixes
- better handling of ffmpeg process
