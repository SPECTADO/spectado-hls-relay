import dotenv from "dotenv";
dotenv.config();
const env = process.env;

const config = {
  http: {
    port: env.HTTP_PORT,
    allow_origin: "*",
  },

  https: env.HTTPS_PORT && {
    port: env.HTTPS_PORT,
    key: env.HTTPS_KEY,
    cert: env.HTTPS_CERT,
  },

  ffmpeg: env.FFMPEGBIN,
  streamSource: env.STREAM_SOURCE,

  codec: {
    type: "aac",
    bitrate: 32,
    channels: 1,
    sampleRate: 44100,
  },

  hls: {
    root: env.MEDIAROOT,
    hlsTime: 3,
    hlsListSize: 2,
    hlsStartNumberSource: "datetime",
    hlsFlags: "delete_segments+omit_endlist+discont_start+append_list",
  },
};

export default config;
