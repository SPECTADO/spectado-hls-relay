import dotenv from "dotenv";
dotenv.config();
const env = process.env;

const config = {
  http: {
    port: env.HTTP_PORT || 8080,
  },

  https: env.HTTPS_PORT && {
    port: env.HTTPS_PORT,
    key: env.HTTPS_KEY,
    cert: env.HTTPS_CERT,
  },

  ffmpeg: env.FFMPEGBIN || "ffmpeg",
  streamSource: env.STREAM_SOURCE || "./sources.json",

  codec: {
    type: "aac",
    bitrate: "32k",
    channels: 1,
    sampleRate: 44100,
  },

  hls: {
    root: env.MEDIAROOT || "/tmp/hls",
    hlsTime: 3,
    hlsListSize: 2,
    hlsStartNumberSource: "datetime",
    hlsFlags: "delete_segments+omit_endlist+discont_start+append_list",
  },
};

export default config;
