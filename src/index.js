import express from "express";
//import crypto from "crypto";
import mkdirp from "mkdirp";
import cluster from "cluster";
import http from "http";
import https from "https";
import fs from "fs";
import config from "./config.js";
import Logger from "./Logger.js";
import filesCleanup from "./workers/filesCleanup.js";
import configFetch from "./workers/configFetch.js";
import pushStats from "./workers/pushStats.js";
import SessionManager from "./session-manager.js";
import routes from "./routes.js";
import serverInfo, { collectLoad } from "./api/serverInfo.js";
import { countListenersPerStream } from "./api/countListeners.js";
//import dayjs from "dayjs";

const server = express();
const srvInfo = serverInfo();
const coreCount = srvInfo.cpu.cores || 4;
const workerCount = coreCount;

const createNewWorker = () => {
  const worker = cluster.fork();

  worker.on("online", () => {
    Logger.info(`Worker with pid '${worker.process?.pid}' had been started`);
  });

  worker.on("exit", (code, signal) => {
    Logger.warn(
      `Worker with pid '${worker.process?.pid}' was killed by signal: ${signal} with code: ${code}`
    );
    createNewWorker();
  });

  worker.on("message", (msg) => {
    //Logger.debug("worker msg", msg?.cmd);
    // receive report of listeners from workers
    if (msg?.cmd === "listenersLive") {
      const pid = msg?.payload?.pid;
      if (pid) {
        global.listenersLive[msg.payload.pid] = msg.payload.listeners;
        global.listenersStack[msg.payload.pid] = msg.payload.listenersStack;
      }
    }
  });
};

const syncWorkerData = () => {
  const streams = global.sessions.getAll();
  for (const id in cluster.workers) {
    cluster.workers[id].send({
      cmd: "sync",
      streams: streams.map((item) => {
        //Logger.debug(item);
        return {
          id: item.id,
          name: item.name ?? false,
          isLive: item.config.isLive ?? false,
          time: item.config.time ?? "-",
          state: item.config.state,
          pid: item.ref?.ffmpeg_exec?.pid,
          started: item.ref?.started,
          listeners: countListenersPerStream(item.id),
          // dbg: global.listenersStack,
        };
      }),
    });
  }
};

if (cluster.isPrimary) {
  // single process code
  Logger.log("                        ");
  Logger.log("██╗  ██╗██╗     ███████╗");
  Logger.log("██║  ██║██║     ██╔════╝");
  Logger.log("███████║██║     ███████╗");
  Logger.log("██╔══██║██║     ╚════██║");
  Logger.log("██║  ██║███████╗███████║");
  Logger.log("╚═╝  ╚═╝╚══════╝╚══════╝");
  Logger.log("   SPECTADO HLS RELAY   ");

  Logger.log("------------------------------------------------");
  Logger.log(srvInfo.server);
  Logger.log(`version: ${srvInfo.version}`);
  Logger.log(
    `${srvInfo.platform} - ${srvInfo.cpu.arch} with ${coreCount} cores`
  );
  Logger.log("------------------------------------------------");

  global.sessions = new SessionManager();
  global.listenersLive = {};
  global.listenersStack = {};

  Logger.log(`FFMPEG binary path is "${config.ffmpeg}"`);

  Logger.log("Started load collector task");
  collectLoad();

  Logger.log(`Started cleanup worker on path "${config.hls.root}"`);
  filesCleanup();

  Logger.log(
    `Started config fetch worker from source "${config.streamSource}"`
  );
  configFetch();

  pushStats();

  Logger.log(
    `Audio Normalization is ${config.codec.normalize ? "enabled" : "disabled"}`
  );

  // init LOGS folder
  mkdirp.sync(`${config.hls.root}/_logs`);

  // Fork workers.
  for (var i = 0; i < workerCount; i++) {
    createNewWorker();
  }

  setInterval(() => {
    //Logger.debug("send sync...");

    //check number of workers...
    const currentWorkerCount = Object.keys(cluster.workers).length;
    if (currentWorkerCount < workerCount) {
      Logger.warn("Missing worker!", currentWorkerCount, workerCount);
      createNewWorker();
    }

    syncWorkerData();
  }, 2000);

  setTimeout(() => {
    syncWorkerData();
  }, 250);
} else if (cluster.isWorker) {
  // run in cluster
  global.streams = [];

  process.on("message", (msg) => {
    //Logger.debug("worker msg", msg?.cmd);

    if (msg?.cmd === "sync") {
      global.streams = msg.streams;
    }
  });

  try {
    http.createServer(server).listen(config.http.port, () => {
      Logger.log(`HTTP  listening on port ${config.http.port}`);
    });
  } catch (err) {
    Logger.warn(`HTTP error - can't start on port ${config.http.port}`);
    Logger.debug(err);
  }

  try {
    if (config.https.port) {
      const httpsOptions = {
        key: fs.readFileSync(config.https.key, "utf8"),
        cert: fs.readFileSync(config.https.cert, "utf8"),
      };

      https.createServer(httpsOptions, server).listen(config.https.port, () => {
        Logger.log(`HTTPS listening on port ${config.https.port}`);
      });
    }
  } catch (err) {
    Logger.warn(`HTTPS error - can't start on port ${config.https.port}`);
    Logger.debug(err);
  }
  // init express view engine - ejs
  server.set("view engine", "ejs");
  server.set("views", "./src/views/");

  // init express web routes
  server.use("/", routes);
}
