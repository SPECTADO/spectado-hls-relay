import dotenv from "dotenv";
dotenv.config();
const env = process.env;

const config = {
  ffmpeg: env.FFMPEGBIN || "ffmpeg",
  streamSource: env.STREAM_SOURCE || "./sources.json",
  logLevel: env.LOGLEVEL || "WARNING",

  http: {
    port: env.HTTP_PORT || 8080,
  },

  https: env.HTTPS_PORT && {
    port: env.HTTPS_PORT,
    key: env.HTTPS_KEY,
    cert: env.HTTPS_CERT,
  },

  codec: {
    type: "aac",
    bitrate: "32k",
    channels: 1,
    sampleRate: 44100,
  },

  hls: {
    root: env.MEDIAROOT || "/tmp/hls",
    hlsTime: 5,
    hlsListSize: 4,
  },
};

export default config;
