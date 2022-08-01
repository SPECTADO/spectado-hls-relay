import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import config from "./config.js";
import Logger from "./Logger.js";
import filesCleanup from "./workers/filesCleanup.js";
import configFetch from "./workers/configFetch.js";
import SessionManager from "./session-manager.js";
import routes from "./routes.js";
import serverInfo from "./api/serverInfo.js";

const server = express();
const srvInfo = serverInfo();

// GLOBAL var
global.sessions = new SessionManager();

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
Logger.log(`${srvInfo.platform} - ${srvInfo.arch}`);
Logger.log("------------------------------------------------");

try {
  http.createServer(server).listen(config.http.port, () => {
    Logger.log(`HTTP  listening on port ${config.http.port}`);
  });
} catch (err) {
  Logger.warn(`HTTP error - can't start on port ${config.https.port}`);
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

Logger.log(`FFMPEG binary path is "${config.ffmpeg}"`);

Logger.log(`Started cleanup worker on path "${config.hls.root}"`);
filesCleanup();

Logger.log(`Started config fetch worker from source "${config.streamSource}"`);
configFetch();

// init express web routes
server.set("view engine", "ejs");
server.set("views", "./src/views/");
server.use("/", routes);

//  setInterval(() => {Logger.debug({ sessions: global.sessions.getAll() });}, 5000);
