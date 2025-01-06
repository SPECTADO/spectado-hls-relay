import fetch from "node-fetch";
import Logger from "../Logger.js";
import config from "../config.js";
import dayjs from "dayjs";
import fs from "fs";

const doPushStats = async () => {
  try {
    let statsData = {};
    Object.values(global.listenersStack).forEach((nodeData) => {
      nodeData?.forEach((item) => {
        const streamId = item?.seg?.id;
        const segmentId = `${item?.seg?.fs_project}`;
        if (!statsData[streamId]) statsData[streamId] = {};
        if (!statsData[streamId][segmentId]) statsData[streamId][segmentId] = 0;
        statsData[streamId][segmentId]++;
      });
    });

    Logger.debug("pushing stats back to API...");
    const resp = await fetch(config.stats.pushUrl, {
      method: "post",
      body: JSON.stringify({
        datetime: dayjs().format(),
        type: "live",
        stats: statsData,
      }),
    });

    if (resp.status !== 200) {
      Logger.warn(
        `stats push failed - ${resp.status} - ${config.stats.pushUrl}`
      );
    }
  } catch (ex) {
    switch (ex.code) {
      case "ECONNREFUSED":
        Logger.error(
          `stats push failed - connection refused - ${config.stats.pushUrl}`
        );
        break;
      default:
        Logger.error(ex);
        break;
    }
  }
};

const doPushPrerollStats = async () => {
  try {
    Logger.debug("pushing preroll stats back to API...");

    const statFileNow = `preroll.${dayjs().format("YYYY-MM-DD-HH")}`;

    fs.readdir(`${config.hls.root}/_logs`, (err, statFiles) => {
      statFiles.forEach(async (statFile) => {
        if (statFile.startsWith(statFileNow)) return;

        try {
          const data = fs.readFileSync(
            `${config.hls.root}/_logs/${statFile}`,
            "utf8"
          );
          const statsData = data
            .split("\n")
            .filter((line) => line.trim() !== "");

          //Logger.debug("stats", { statsData });

          const resp = await fetch(config.stats.pushUrl, {
            method: "post",
            body: JSON.stringify({
              datetime: dayjs().format(),
              type: "preroll",
              stats: statsData,
            }),
          });

          if (resp.status !== 200) {
            Logger.warn(
              `preroll stats push failed - ${resp.status} - ${config.stats.pushUrl}`
            );
          }

          fs.rmSync(`${config.hls.root}/_logs/${statFile}`);
        } catch (err) {
          Logger.error(
            `Failed to read or process file ${statFile} - ${err.message}`
          );
        }
      });
    });
  } catch (ex) {
    switch (ex.code) {
      case "ECONNREFUSED":
        Logger.error(
          `preroll stats push failed - connection refused - ${config.stats.pushUrl}`
        );
        break;
      default:
        Logger.error(ex);
        break;
    }
  }
};

const pushStats = () => {
  Logger.log(
    `pushStats ${config.stats.enabled ? "ENABLED" : "disabled"}, interval ${
      config.stats.interval
    }`
  );

  if (config.stats.enabled) {
    setInterval(() => {
      doPushStats();
    }, config.stats.interval * 1000);

    setInterval(() => {
      doPushPrerollStats();
    }, config.stats.interval * 1000 + 5000);
  }
};
export default pushStats;
