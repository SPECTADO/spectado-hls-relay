import express from "express";
import fs from "fs";
import config from "../config.js";
import Logger from "../Logger.js";
import cluster from "cluster";
import { exit } from "process";
const router = express.Router();

let listenersStack = [];
if (cluster.isWorker) {
  setInterval(() => {
    const expire = Date.now() - 1000 * (config.hls.hlsTime || 5);
    listenersStack = listenersStack.filter((item) =>
      item.ts >= expire ? true : false
    );

    process.send({
      cmd: "listenersLive",
      payload: {
        pid: process.pid,
        listeners: listenersStack.length,
        listenersStack: listenersStack,
      },
    });
  }, 15000);
}

//router.all("/:streamId/init.mp4", (req, _res, next) => { const streamId = req.params?.streamId; Logger.debug(`New listener of stream '${streamId}'`); next(); });

router.all("*.m3u8", (req, res, _next) => {
  const ct = config.hls.hlsTime || 5;
  res.header(
    "Cache-Control",
    `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
  );

  const filename = `${config.hls.root}${req.params[0]}.m3u8`;
  fs.readFile(filename, "utf8", (err, playlistData) => {
    if (err) {
      switch (err.errno) {
        case -2:
          res.status(404).send("Not Found");
          break;
        default:
          res.status(500).send("Error");
          Logger.error("playlist error", err);
          break;
      }
      return;
    }

    const queryParam = new URLSearchParams(req.query).toString();
    const playlistWithQueryParams = playlistData.replaceAll(
      ".m4s",
      `.m4s?${queryParam}`
    );

    if (req.params[0] === "/xx-fallback/playlist") {
      // temp test
      res
        .status(200)
        .send(
          playlistWithQueryParams.replace(
            '#EXT-X-MAP:URI="init.mp4"',
            '#EXT-X-MAP:URI="init.mp4"\r\n#EXTINF:12,\r\npreroll.m4s\r\n#EXT-X-DISCONTINUITY'
          )
        );
      return;
    }

    res.status(200).send(playlistWithQueryParams);
  });
});

router.all("*.m4s", (req, res, next) => {
  const ct = (config.hls.hlsTime || 5) * 10;

  try {
    const streamName = req.params[0]?.split("/")?.at(1);

    const listenerObject = {
      ts: Date.now(),
      seg: {
        id: streamName,
        platform: req.query.platform,
        fs_project: req.query.fs_project,
      },
    };
    listenersStack.push(listenerObject);
    //Logger.debug(req.params, req.query, streamName, listenerObject);
  } catch {}

  res.header(
    "Cache-Control",
    `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
  );

  next();
});

router.use("/", express.static(config.hls.root));

export default router;
