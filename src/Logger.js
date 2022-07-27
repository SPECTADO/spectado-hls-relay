//const chalk = require("chalk");
import chalk from "chalk";

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
  console.log(logTime(), process.pid, chalk.bold.blue("[INFO]"), ...args);
};

const error = (...args) => {
  console.log(logTime(), process.pid, chalk.bold.red("[ERROR]"), ...args);
};

const debug = (...args) => {
  console.log(logTime(), process.pid, chalk.bold.yellow("[DEBUG]"), ...args);
};

const ffdebug = (...args) => {
  console.log(logTime(), process.pid, chalk.bold.bgYellow("[FFMPEG]"), ...args);
};

export default {
  log,
  info,
  error,
  debug,
  ffdebug,
};
