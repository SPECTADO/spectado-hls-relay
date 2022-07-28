import os from "os";
// import config from "../config.js";
import { readFile } from "fs/promises";

const json = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url))
);

const serverInfo = () => {
  return {
    server: json.name,
    version: json.version,
    memory: { free: os.freemem(), total: os.totalmem() },
    uptime: os.uptime(),
    load: os.loadavg(),
    arch: os.arch(),
    platform: os.platform(),
  };
};

export default serverInfo;
