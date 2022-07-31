import dotenv from "dotenv";
dotenv.config();
const env = process.env;

const config = {
  ffmpeg: env.SHLS_FFMPEGBIN || "ffmpeg",
  streamSource: env.SHLS_STREAM_SOURCE || "./sources.json",
  logLevel: env.SHLS_LOGLEVEL || "WARNING",

  http: {
    port: env.SHLS_HTTP_PORT || 8080,
  },

  https: env.SHLS_HTTPS_PORT && {
    port: env.SHLS_HTTPS_PORT,
    key: env.SHLS_HTTPS_KEY,
    cert: env.SHLS_HTTPS_CERT,
  },

  codec: {
    type: env.SHLS_CODEC || "aac",
    bitrate: env.SHLS_BITRATE || "64k",
    channels: env.SHLS_CHANNELS || 2,
    sampleRate: env.SHLS_SAMPLERATE || 44100,
  },

  hls: {
    root: env.SHLS_MEDIAROOT || "/tmp/hls",
    hlsTime: 5,
    hlsListSize: 4,
  },
};

export default config;
