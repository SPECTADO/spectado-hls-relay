import Logger from "../Logger.js";
//import config from "../config.js";

const streamInfo = (req) => {
  const streams = global.sessions.getAll();
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return streams.map((item) => {
    return {
      id: item.id,
      link: `${baseUrl}/live/${item.id}/playlist.m3u8`,
      pid: item.ref?.ffmpeg_exec?.pid,
      started: item.ref?.started,
    };
  });
};

export default streamInfo;
