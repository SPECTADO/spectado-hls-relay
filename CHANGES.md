# HLS Relay server

## 1.2.1

- multi-core support for running express web server
- can handle much greater load
- listeners count is now updated once every 30 seconds and is current number of listeners (approximated)

## 1.1.2

- Fixed bug (waning in logs) when no User-Agent string is present

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
