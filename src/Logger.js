//const chalk = require("chalk");
import chalk from "chalk";

const LOG_TYPES = {
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
  DEBUG: 4,
  FFDEBUG: 5,
};
const logType = LOG_TYPES.DEBUG;

const logTime = () => {
  let nowDate = new Date();
  return `${nowDate.toLocaleDateString()} ${nowDate.toLocaleTimeString([], {
    hour12: false,
  })}`;
};

const log = (...args) => {
  console.log(logTime(), process.pid, chalk.bold.green(">>"), ...args);
};

const info = (...args) => {
  if (logType < LOG_TYPES.INFO) return;
  console.log(logTime(), process.pid, chalk.bold.blue("[INFO]"), ...args);
};

const warn = (...args) => {
  if (logType < LOG_TYPES.WARNING) return;
  console.log(logTime(), process.pid, chalk.bold.redBright("[WARN]"), ...args);
};

const error = (...args) => {
  if (logType < LOG_TYPES.ERROR) return;
  console.log(logTime(), process.pid, chalk.bold.red("[ERROR]"), ...args);
};

const debug = (...args) => {
  if (logType < LOG_TYPES.DEBUG) return;
  console.log(logTime(), process.pid, chalk.bold.yellow("[DEBUG]"), ...args);
};

const ffdebug = (...args) => {
  if (logType < LOG_TYPES.FFDEBUG) return;
  console.log(logTime(), process.pid, chalk.bold.bgYellow("[FFMPEG]"), ...args);
};

export default {
  log,
  info,
  warn,
  error,
  debug,
  ffdebug,
};
