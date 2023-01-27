import express from "express";
import fs from "fs";
import config from "../config.js";
import Logger from "../Logger.js";
import cluster from "cluster";
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

  const filename = `${config.hls.root}${req.params[0]}.m3u8`;
  fs.readFile(filename, "utf8", (err, playlistData) => {
    if (err) {
      res.status(500).send("");
      Logger.error("playlist error", err);
    }

    const queryParam = new URLSearchParams(req.query).toString();
    res
      .header(
        "Cache-Control",
        `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
      )
      .status(200)
      .send(playlistData.replaceAll(".m4s", `.m4s?${queryParam}`));
  });

  /*
  const streamName = req.params[0]?.split("/")?.at(1);

  const listenerObject = {
    ts: Date.now(),
    seg: {
      id: streamName,
      platform: req.query.platform,
      fs_project: req.query.fs_project,
    },
  };
  //Logger.debug(req.params, req.query, streamName, listenerObject);
  listenersStack.push(listenerObject);

  res.header(
    "Cache-Control",
    `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
  );

  next();

  
  const filename = `${config.hls.root}${req.params[0]}.m3u8`;
  fs.readFile(filename, "utf8", (err, playlistData) => {
    if (err) {
      res.status(500).send("");
      Logger.error("playlist error", err);
    }

    const queryParam = new URLSearchParams(req.query).toString();
    res
      .header(
        "Cache-Control",
        `max-age:${ct},s-max-age=${ct},must-revalidate,proxy-revalidate,stale-while-revalidate`
      )
      .status(200)
      .send(playlistData.replaceAll(".m4s", `.m4s?${queryParam}`));
  });
  */
});

router.all("*.m4s", (req, res, next) => {
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
    `max-age:120,s-max-age=120,stale-while-revalidate`
  );
  next();
});

router.use("/", express.static(config.hls.root));

export default router;
