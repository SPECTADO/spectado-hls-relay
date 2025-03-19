import os from "os";
import cluster from "cluster";
// import config from "../config.js";
import si from "systeminformation";
import { readFile } from "fs/promises";
import generateServerId from "../helpers/serverUuid.js";
import Logger from "../Logger.js";

const json = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url))
);

const netInfo = await si.networkInterfaces("*"); // .speed - Mbit / s
const netSpeed = netInfo.reduce(
  (speed, int) => (int.speed > speed ? int.speed : speed),
  -1
);
//const netInterfaces = await si.networkInterfaces();

let netLoad = -1;
let netTx = -1;
let netRx = -1;
let countListeners = -1;

const collectLoad = () => {
  Logger.log("Starting load collector...");

  setInterval(() => {
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
        netLoad = Math.round((txSpeed / netSpeed) * 1000) / 10;
        netTx = txSpeed;
        netRx = rxSpeed;

        const listenersNow = Object.values(global.listenersLive).reduce(
          (count, item) => count + parseInt(item),
          0
        );

        const listenersPids = Object.keys(global.listenersLive);
        let clusterPids = [];

        for (const id in cluster.workers) {
          cluster.workers[id].send({
            cmd: "loadSync",
            payload: {
              netLoad,
              netTx,
              netRx,
              netSpeed,
            },
          });

          cluster.workers[id].send({
            cmd: "listenersSync",
            payload: {
              listeners: listenersNow,
            },
          });

          clusterPids.push(cluster.workers[id].process.pid.toString());
        }

        listenersPids.forEach((pid) => {
          if (!clusterPids.includes(pid)) {
            Logger.debug(`Orphan PID in stats, ${pid}`);
            delete global.listenersLive[pid];
          }
        });

        //Logger.debug(listenersNow, global.listenersLive);
        //Logger.debug("LOAD", { netLoad, txSpeed, rxSpeed, netSpeed });
      } catch (e) {
        Logger.debug("networkStats error", e);
      }
    });
  }, 5000);
};

if (cluster.isWorker) {
  process.on("message", (msg) => {
    //Logger.debug("worker msg", msg?.cmd);

    if (msg?.cmd === "loadSync") {
      //Logger.debug("sync load data from primary node...", msg.payload);
      netLoad = msg.payload?.netLoad || 0;
      netTx = msg.payload?.netTx || 0;
      netRx = msg.payload?.netRx || 0;
    }

    if (msg?.cmd === "listenersSync") {
      //Logger.debug("sync load data from primary node...", msg.payload);
      countListeners = msg.payload?.listeners || 0;
    }
  });
}

const serverInfo = () => {
  const cpuLoad = os.loadavg();

  return {
    server: json.name,
    version: json.version,
    pid: process.pid,
    machineId: generateServerId(),
    load: netLoad || 0,
    listeners: countListeners || 0,
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
      cores: os.cpus().length,
    },
    platform: os.platform(),
  };
};

export default serverInfo;
export { serverInfo, collectLoad };
