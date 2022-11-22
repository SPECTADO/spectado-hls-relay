import express from "express";
import crypto from "crypto";
import useragent from "express-useragent";
import config from "../config.js";
import Logger from "../Logger.js";

const router = express.Router();

const countStats = async (req) => {
  const streamId = req.params?.streamId;

  const isStreamOnline = global.sessions?.activeSessions.reduce(
    (ret, sess) => (sess.id === streamId && sess.config?.stats ? true : ret),
    false
  );

  if (isStreamOnline) {
    try {
      const ua = useragent.parse(req.headers["user-agent"]);
      const uaHash = crypto
        .createHash("md5")
        .update(`${ua.source}${req.headers["accept-language"]}`)
        .digest("hex");
      const ipHash = Buffer.from(req.ip || "?").toString("base64");
      const hashId = `${streamId}-${ipHash}-${uaHash}`;

      global.listeners = global.listeners.filter((item) => item.lid !== hashId);

      global.listeners.push({
        id: streamId,
        lid: hashId,
        user: `${ua.platform}|${ua.browser}|${ua.version}`,
      });

      Logger.debug(
        `Stream "${streamId}" has a new listener with hash "${hashId}"`
      );
    } catch (e) {
      Logger.warn(e);
    }
  }
};

router.all("/:streamId/init.mp4", (req, _res, next) => {
  countStats(req);
  next();
});

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
