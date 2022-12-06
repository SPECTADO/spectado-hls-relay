//import config from "../config.js";

const streamsInfo = (req) => {
  const streams = global.streams;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return streams.map((item) => {
    return {
      ...item,
      link: `${baseUrl}/live/${item.id}/playlist.m3u8`,
    };
  });
};

export default streamsInfo;
