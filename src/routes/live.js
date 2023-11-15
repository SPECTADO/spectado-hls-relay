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

router.all("*.m3u8", (req, res, _next) => {
  const playlistPath = req.params[0];
  //const streamName = playlistPath?.split("/")?.at(1);
  const fsProject = req.query.fs_project;
  const ct = config.hls.hlsTime || 5;

  const filename = `${config.hls.root}${playlistPath}.m3u8`;
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

    let playlistWithQueryParams = playlistData;

    if (req.query?.fs_project) {
      playlistWithQueryParams = playlistWithQueryParams.replaceAll(
        ".m4s",
        `.m4s?fs_project=${req.query.fs_project}`
      );
    }

    // inject pre-roll
    //todo: find existing preroll key based on userdata
    const streamName = playlistPath?.split("/")?.at(1);
    const prerollKey = getPrerollKey(streamName, req);
    const prerollFile = `preroll-${prerollKey}.m4a`;
    //const prerollDuration = 4;
    const hasPreroll = prerollKey ? true : false;

    const allowedProjects = [
      11606, 11640, 11603, 11622, 11639, 11633, 11618, 11643, 11646, 11608,
      11698, 11651, 11661, 11676, 11642, 11671, 11660, 11609, 11621, 11613,
      11654, 11697, 11647, 11625, 11620, 11657, 11665, 11614, 11631, 11605,
      11623, 11610, 11669, 11653, 11601, 11674, 11675, 11659, 11636, 11649,
      11658, 11662, 11672, 11641, 11632, 11607, 11673, 11611, 11615, 11602,
      11645, 11648, 11650, 11644, 11652, 11663, 11692, 11612, 11634, 11626,
      11604, 11664, 11694, 11696, 11616, 11695, 11693, 11656, 11628, 12606,
      12640, 12603, 12622, 12639, 12633, 12618, 12643, 12646, 12608, 12698,
      12651, 12661, 12676, 12642, 12671, 12660, 12609, 12621, 12613, 12654,
      12697, 12647, 12625, 12620, 12657, 12665, 12614, 12631, 12605, 12623,
      12610, 12669, 12653, 12601, 12674, 12675, 12659, 12636, 12649, 12658,
      12662, 12672, 12641, 12632, 12607, 12673, 12611, 12615, 12602, 12645,
      12648, 12650, 12644, 12652, 12663, 12692, 12612, 12634, 12626, 12604,
      12664, 12694, 12696, 12616, 12695, 12812, 12693, 12656, 12628, 14603,
      14618, 14608, 14609, 14613, 14654, 14620, 14614, 14605, 14623, 14610,
      14669, 14601, 14662, 14672, 14641, 14632, 14607, 14673, 14611, 14615,
      14602, 14663, 14612, 14604, 14677, 14616, 14812, 14628, 13606, 13640,
      13603, 13622, 13639, 13633, 13618, 13643, 13608, 13661, 13660, 13609,
      13621, 13613, 13654, 13625, 13620, 13657, 13614, 13631, 13605, 13623,
      13610, 13669, 13601, 13636, 13658, 13662, 13641, 13632, 13607, 13611,
      13615, 13602, 13663, 13612, 13634, 13626, 13604, 13664, 13616, 13812,
      13656, 13628,
    ];
    //Logger.debug({streamName,fsProject,prerollKey,prerollFile,hasPreroll,});

    if (hasPreroll && allowedProjects.includes(parseInt(fsProject))) {
      playlistWithQueryParams = playlistWithQueryParams.replace(
        '#EXT-X-MAP:URI="init.mp4"',
        `#EXT-X-MAP:URI="init.mp4"\r\n#EXTINF:6,\r\n${prerollFile}\r\n#EXT-X-DISCONTINUITY`
      );
      // #EXTINF:${prerollDuration}\r\n
    }
    // [end] inject pre-roll

    /*
    const fullRequestUrl = `${req.protocol}://${req.get(
      "host"
    )}/live/${streamName}`;
    playlistWithQueryParams = playlistWithQueryParams.replaceAll(
      "preroll-",
      `${fullRequestUrl}/preroll-`
    );
    playlistWithQueryParams = playlistWithQueryParams.replaceAll(
      "segment-",
      `${fullRequestUrl}/segment-`
    );
    */

    res.header(
      "Cache-Control",
      `max-age:${Math.round(ct / 2)},s-max-age=${Math.round(
        ct / 2
      )},must-revalidate,proxy-revalidate,stale-while-revalidate`
    );
    res.header("Content-Type", 'application/vnd.apple.mpegurl; charset=""');

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
