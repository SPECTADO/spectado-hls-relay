import os from "os";
// import config from "../config.js";
import si from "systeminformation";
import { readFile } from "fs/promises";
import Logger from "../Logger.js";

const json = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url))
);

let netLoad = -1;
let netTx = -1;
let netRaw = {};
const netInfo = await si.networkInterfaces("default"); // .speed - Mbit / s
const netInterfaces = await si.networkInterfaces();

setInterval(function () {
  si.networkStats().then((data) => {
    try {
      const txSpeed = parseInt(data[0].tx_sec / 1024 / 1024); // .tx_sec bytes / second
      netLoad = Math.round((txSpeed / netInfo.speed) * 100);
      netTx = txSpeed;
      netRaw = data;
    } catch (e) {
      Logger.error(e);
    }
  });
}, 5000);

const serverInfo = () => {
  const cpuLoad = os.loadavg();
  let totalListeners = global?.listeners?.length ?? 0;

  return {
    server: json.name,
    version: json.version,
    load: netLoad || 0,
    listeners: totalListeners,
    memory: { free: os.freemem(), total: os.totalmem() },
    uptime: os.uptime(),
    eth: {
      tx: netTx,
      speed: netInfo.speed,
      _raw: { netInfo, netRaw, netInterfaces },
    },
    cpu: {
      load: cpuLoad,
      arch: os.arch(),
    },
    platform: os.platform(),
  };
};

export default serverInfo;
