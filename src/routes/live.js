import express from "express";
import config from "../config.js";
//import Logger from "../Logger.js";

const router = express.Router();

//router.all("/:streamId/init.mp4", (req, _res, next) => { const streamId = req.params?.streamId; Logger.debug(`New listener of stream '${streamId}'`); next(); });

router.all("*.m3u8", (req, res, next) => {
  const ct = config.hls.hlsTime || 5;

  res.header(
    "Cache-Control",
    `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
  );
  next();
});

router.all("*.m4s", (_req, res, next) => {
  res.header(
    "Cache-Control",
    `max-age:120,s-max-age=120,stale-while-revalidate`
  );
  next();
});

router.use("/", express.static(config.hls.root));

export default router;
