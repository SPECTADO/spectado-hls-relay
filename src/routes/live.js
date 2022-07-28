import express from "express";
import config from "../config.js";

const router = express.Router();

router.all("*.m3u8", (_req, res, next) => {
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
    `max-age:120,s-max-age=120,must-revalidate,proxy-revalidate,stale-while-revalidate`
  );
  next();
});

router.use("/", express.static(config.hls.root));

export default router;
