import fetch from "node-fetch";
import Logger from "../Logger.js";
import config from "../config.js";

const doPushStats = async () => {
  try {
    let statsData = [];
    Object.values(global.listenersStack).forEach((nodeData) => {
      nodeData?.forEach((item) => {
        const streamId = item?.seg?.id;
        const segmentId = `${item?.seg?.platform}-${item?.seg?.fs_project}`;
        if (!statsData[streamId]) statsData[streamId] = [];
        if (!statsData[streamId][segmentId]) statsData[streamId][segmentId] = 0;
        statsData[streamId][segmentId]++;
      });
    });

    //Logger.debug("pushing stats back to API...", statsData);
    const resp = await fetch(config.stats.pushUrl, {
      method: "post",
      body: JSON.stringify(statsData),
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
  }
};
export default pushStats;
