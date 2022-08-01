import os from "os";
// import config from "../config.js";
import { readFile } from "fs/promises";

const json = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url))
);

const serverInfo = () => {
  const cpuLoad = os.loadavg();

  return {
    server: json.name,
    version: json.version,
    load: cpuLoad[0], // change for TCP connections...
    memory: { free: os.freemem(), total: os.totalmem() },
    uptime: os.uptime(),
    cpu: {
      load: cpuLoad,
      arch: os.arch(),
    },
    platform: os.platform(),
  };
};

export default serverInfo;
