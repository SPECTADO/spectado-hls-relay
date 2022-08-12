// import EventEmitter from "events";
import { spawn } from "child_process";
import Logger from "./Logger.js";
import config from "./config.js";
import mkdirp from "mkdirp";
import fs from "fs";

const watchdogInterval = 10000;

/**
 * config object
 * {
 *    id: <string>,
 *    source: <string>
 * }
 */
class FfmpegManager {
  constructor(config) {
    //super();
    this.ffmpeg_exec = null;
    this.started = new Date();
    this.config = config;
    this.watchdog = null;
  }

  start() {
    if (global.sessions.get(this.config.id) !== null) {
      Logger.error(
        `Can't start ffmpeg session - session with id "${this.config.id}" already exists!`
      );
      return false;
    }

    // create the HLS folder
    const hlsPath = `${config.hls.root}/${this.config.id}`;
    mkdirp.sync(hlsPath);
    try {
      const newPlaylistPath = `${hlsPath}/playlist.m3u8`;
      if (!fs.existsSync(newPlaylistPath)) {
        fs.closeSync(fs.openSync(newPlaylistPath, "w"));
      }
    } catch {}

    let argv = [
      "-loglevel",
      "info",
      "-stream_loop",
      "-1",
      "-re",
      "-i",
      this.config.source,
      "-c:a",
      config.codec.type,
      "-ab",
      config.codec.bitrate,
      "-ac",
      config.codec.channels,
      "-ar",
      config.codec.sampleRate,
      "-f",
      "hls",
      "-hls_segment_type",
      "fmp4",
      "-segment_list_flags",
      "live",
      // "-hls_playlist_type","event",
      "-hls_time",
      config.hls.hlsTime,
      "-hls_list_size",
      config.hls.hlsListSize,
      "-hls_segment_filename",
      `${hlsPath}/s%4d.m4s`,
      "-hls_flags",
      "delete_segments+omit_endlist+discont_start+append_list+program_date_time",
      `${hlsPath}/playlist.m3u8`,
    ];

    this.ffmpeg_exec = spawn(config.ffmpeg, argv);
    Logger.debug(`Created ffmpeg process with id ${this.ffmpeg_exec.pid}`);
    global.sessions.add(this);
    this.watchdog = setTimeout(
      this.handleHangedFfmpeg.bind(this),
      watchdogInterval
    );

    this.ffmpeg_exec.on("error", (e) => {
      Logger.error(e);
    });

    this.ffmpeg_exec.stdout.on("data", (data) => {
      Logger.ffdebug(`[${this.config.id}] - ${data}`);
      clearTimeout(this.watchdog);
      this.watchdog = setTimeout(
        this.handleHangedFfmpeg.bind(this),
        watchdogInterval
      );
    });

    this.ffmpeg_exec.stderr.on("data", (data) => {
      Logger.ffdebug(`[${this.config.id}] - ${data}`);
      clearTimeout(this.watchdog);
      this.watchdog = setTimeout(
        this.handleHangedFfmpeg.bind(this),
        watchdogInterval
      );
    });

    this.ffmpeg_exec.on("close", (code) => {
      clearTimeout(this.watchdog);
      // code 255 = clean exit - killed by manager
      if (code !== 255) {
        global.sessions.kill(this.config.id);
        Logger.warn(
          `Transmuxing of "${this.config.id}" ended with code ${code}`
        );
        return;
      }

      global.sessions.removeRef(this.config.id); // ffmpeg could be killed as process
      Logger.debug(
        `Transmuxing of "${this.config.id}" ended with code ${code}`
      );
    });
  }

  end() {
    return new Promise((resolve, _reject) => {
      try {
        this.ffmpeg_exec.kill();
      } catch {}
      Logger.debug(
        `Killing ffmpeg process for "${this.config.id}" with PID of ${this.ffmpeg_exec.pid}`
      );
      resolve();
    });
  }

  handleHangedFfmpeg() {
    Logger.error(
      `FFMPEG process for stream "${this.config.id}" with pid "${this.ffmpeg_exec.pid}" seems to be frozen...`
    );
    this.ffmpeg_exec.kill();
    global.sessions.removeRef(this.config.id);
  }
}

export default FfmpegManager;
