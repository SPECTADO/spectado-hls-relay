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
let netRx = -1;
const netInfo = await si.networkInterfaces("*"); // .speed - Mbit / s
const netSpeed = netInfo.reduce(
  (speed, int) => (int.speed > speed ? int.speed : speed),
  -1
);
//const netInterfaces = await si.networkInterfaces();

setInterval(function () {
  si.networkStats("*").then((data) => {
    //Logger.debug(data);
    try {
      const txSpeed = Math.round(
        (data.reduce((tx, int) => tx + parseFloat(int.tx_sec), 0) /
          1024 /
          1024) *
          8
      );
      const rxSpeed = Math.round(
        (data.reduce((rx, int) => rx + parseFloat(int.rx_sec), 0) /
          1024 /
          1024) *
          8
      );
      netLoad = Math.round((txSpeed / netSpeed) * 100);
      netTx = txSpeed;
      netRx = rxSpeed;

      //Logger.debug({ txSpeed, rxSpeed, netSpeed });
    } catch (e) {
      Logger.debug("networkStats error", e);
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
      rx: netRx,
      speed: netSpeed,
    },
    cpu: {
      load: cpuLoad,
      arch: os.arch(),
    },
    platform: os.platform(),
  };
};

export default serverInfo;
