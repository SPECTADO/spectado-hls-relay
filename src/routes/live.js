import express from "express";
import mime from "mime";
import fs from "fs";
import config from "../config.js";
import Logger from "../Logger.js";
import cluster from "cluster";
import { getPrerollKey } from "../helpers/preroll.js";
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

mime.define({ "application/vnd.apple.mpegurl": ["m3u8"] });

//router.all("/:streamId/init.mp4", (req, _res, next) => { const streamId = req.params?.streamId; Logger.debug(`New listener of stream '${streamId}'`); next(); });

router.all("*.m3u8", async (req, res, _next) => {
  const playlistPathArr = (req.params[0] || "").split("~") || ["", ""];
  const playlistPath = playlistPathArr[0];
  const playlistFsProject = playlistPathArr[1] || req.query.fs_project;
  const ct = config.hls.hlsTime || 5;

  const filename = `${config.hls.root}${playlistPath}.m3u8`;
  fs.readFile(filename, "utf8", async (err, playlistData) => {
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

    let playlistWithQueryParams = playlistData;

    if (playlistFsProject) {
      playlistWithQueryParams = playlistWithQueryParams.replaceAll(
        ".m4s",
        `.m4s?fs_project=${playlistFsProject}`
      );
    }

    // inject pre-roll
    const streamName = playlistPath?.split("/")?.at(1);
    const prerollKey = await getPrerollKey(streamName, playlistFsProject, req);
    const prerollFile = `preroll-${prerollKey}.m4s`;
    //const prerollDuration = 4;
    const hasPreroll = prerollKey ? true : false;

    Logger.debug("[M3U8]", { streamName, prerollKey, hasPreroll });

    if (hasPreroll) {
      playlistWithQueryParams = playlistWithQueryParams.replace(
        '#EXT-X-MAP:URI="init.mp4"',
        `#EXT-X-MAP:URI="init.mp4"\r\n#EXT-X-DISCONTINUITY\r\n#EXTINF:6,\r\n${prerollFile}\r\n#EXT-X-DISCONTINUITY`
      );
      // #EXTINF:${prerollDuration}\r\n
    }
    // [end] inject pre-roll

    Logger.debug("[M3U8]", {
      playlistPathArr,
      playlistPath,
      playlistFsProject,
      ct,
      streamName,
      prerollKey,
      prerollFile,
      hasPreroll,
    });

    res.header(
      "Cache-Control",
      `max-age:${Math.round(ct / 2)},s-max-age=${Math.round(
        ct / 2
      )},must-revalidate,proxy-revalidate,stale-while-revalidate`
    );
    res.header("Content-Type", "application/vnd.apple.mpegurl");

    res.status(200).send(playlistWithQueryParams);
  });
});

router.all("*.m4s", (req, res, next) => {
  const ct = (config.hls.hlsTime || 5) * 10;

  try {
    const playlistPath = req.params[0];
    const streamName = playlistPath?.split("/")?.at(1);

    const listenerObject = {
      ts: Date.now(),
      seg: {
        id: streamName,
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
