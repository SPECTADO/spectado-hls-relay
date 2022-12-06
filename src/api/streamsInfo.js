//import config from "../config.js";

const streamsInfo = (req) => {
  const streams = global.streams;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return streams.map((item) => {
    return {
      id: item.id,
      name: item.name ?? false,
      link: `${baseUrl}/live/${item.id}/playlist.m3u8`,
      pid: item.ref?.ffmpeg_exec?.pid,
      started: item.ref?.started,
    };
  });
};

export default streamsInfo;
