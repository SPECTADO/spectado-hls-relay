// import EventEmitter from "events";
import { spawn } from "child_process";
import Logger from "./Logger.js";
import config from "./config.js";
import mkdirp from "mkdirp";
import fs from "fs";

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
      fs.closeSync(fs.openSync(`${hlsPath}/_lock`, "w"));
    } catch {}

    let argv = [
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
      "-hls_delete_threshold",
      config.hls.hlsListSize + 2,
      // "-hls_start_number_source", "datetime",
      // "-start_number","8",
      "-hls_segment_filename",
      `${hlsPath}/s%8d.m4s`,
      "-hls_flags",
      "delete_segments+omit_endlist+discont_start+append_list+program_date_time",
      `${hlsPath}/playlist.m3u8`,
    ];

    this.ffmpeg_exec = spawn(config.ffmpeg, argv);
    Logger.debug(`Created ffmpeg process with id ${this.ffmpeg_exec.pid}`);
    global.sessions.add(this);

    this.ffmpeg_exec.on("error", (e) => {
      Logger.error(e);
    });

    this.ffmpeg_exec.stdout.on("data", (data) => {
      Logger.ffdebug(`[${this.config.id}] - ${data}`);
    });

    this.ffmpeg_exec.stderr.on("data", (data) => {
      Logger.ffdebug(`[${this.config.id}] - ${data}`);
    });

    this.ffmpeg_exec.on("close", (code) => {
      try {
        fs.unlinkSync(`${config.hls.root}/${this.config.id}/_lock`);
      } catch {}

      // code 255 = clean exit - killed by manager
      if (code !== 255) {
        global.sessions.kill(this.config.id);
        Logger.warn(
          `Transmuxing of "${this.config.id}" ended with code ${code}`
        );
        return;
      }

      global.sessions.removeRef(this.config.id); // ffmpeg could be killed as proccess
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
}

export default FfmpegManager;
