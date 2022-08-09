import EventEmitter from "events";
import Logger from "./Logger.js";
//import config from "./config.js";

class SessionManager extends EventEmitter {
  constructor(conf) {
    super();
    this.activeSessions = [];
  }

  add(ffmpegManager) {
    const id = ffmpegManager.config.id;

    if (this.get(id) !== null) {
      Logger.warn(`Session with id "${id}" already exists!`);
      ffmpegManager.end();
      return false;
    }

    Logger.info(`stream-added event ${id}`);
    this.activeSessions.push({
      id,
      name: ffmpegManager.config.name,
      config: ffmpegManager.config,
      ref: ffmpegManager,
    });
  }

  remove(id) {
    this.kill(id);
  }

  kill(id) {
    const session = this.get(id);
    if (session === null) return false;

    session.ref
      .end()
      .then(() => {
        this.removeRef(id);
      })
      .catch(() => {
        /*ffmpeg manager's end() will never reject */
      });
  }

  // will remove session from the list without killing the ffmpeg process!!!
  removeRef(id) {
    Logger.debug(`Removing reference to ffmpeg manager with is ${id}`);
    this.activeSessions = this.activeSessions.filter((item) => item.id !== id);
    global.listeners = global.listeners.filter((item) => item.id !== id);
    return true;
  }

  getAll() {
    return this.activeSessions;
  }

  get(id) {
    const session = this.activeSessions.filter((item) => item.id === id);

    return session.length < 1 ? null : session[0];
  }
}

export default SessionManager;
