import express from "express";
//import crypto from "crypto";
import cluster from "cluster";
import http from "http";
import https from "https";
import fs from "fs";
import config from "./config.js";
import Logger from "./Logger.js";
import filesCleanup from "./workers/filesCleanup.js";
import configFetch from "./workers/configFetch.js";
import SessionManager from "./session-manager.js";
import routes from "./routes.js";
import serverInfo, { collectLoad } from "./api/serverInfo.js";

const server = express();
const srvInfo = serverInfo();
const coreCount = srvInfo.cpu.cores || 4;

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

  Logger.log(`FFMPEG binary path is "${config.ffmpeg}"`);

  Logger.log("Started load collector task");
  collectLoad();

  Logger.log(`Started cleanup worker on path "${config.hls.root}"`);
  filesCleanup();

  Logger.log(
    `Started config fetch worker from source "${config.streamSource}"`
  );
  configFetch();

  Logger.log(
    `Audio Normalization is ${config.codec.normalize ? "enabled" : "disabled"}`
  );

  // Fork workers.
  for (var i = 0; i < coreCount; i++) {
    const worker = cluster.fork();
    Logger.log(`worker with pid '${worker.process?.pid}' had been started`);

    worker.on("online", () => {
      Logger.info(`worker has been started...`);
    });

    worker.on("exit", (code, signal) => {
      if (signal) {
        Logger.warn(`worker was killed by signal: ${signal}`);
      } else if (code !== 0) {
        Logger.warn(`worker exited with error code: ${code}`);
      } else {
        Logger.debug("worker exited normally");
      }
    });
  }

  setInterval(() => {
    Logger.debug("send sync...");
    const streams = global.sessions.getAll();

    for (const id in cluster.workers) {
      cluster.workers[id].send({
        cmd: "sync",
        streams: streams.map((item) => {
          return {
            id: item.id,
            name: item.name ?? false,
            //link: `${baseUrl}/live/${item.id}/playlist.m3u8`,
            pid: item.ref?.ffmpeg_exec?.pid,
            started: item.ref?.started,
          };
        }),
      });
    }
  }, 5000);
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
