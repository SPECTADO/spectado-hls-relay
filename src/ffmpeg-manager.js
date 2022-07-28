// import EventEmitter from "events";
import { spawn } from "child_process";
import Logger from "./Logger.js";
import config from "./config.js";
import mkdirp from "mkdirp";

class FfmpegManager {
  constructor(config) {
    //super();
    this.ffmpeg_exec = null;

    this.config = config;
    /* conf = {
        id: <string>,
        source: <string>
    }
    */
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

    let argv = [
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
      "-hls_time",
      config.hls.hlsTime,
      "-hls_list_size",
      config.hls.hlsListSize,
      "-hls_start_number_source",
      config.hls.hlsStartNumberSource,
      "-hls_flags",
      config.hls.hlsFlags,
      `${hlsPath}/playlist.m3u8`,
    ];

    this.ffmpeg_exec = spawn(config.ffmpeg, argv);
    Logger.debug(`Created ffmpeg process with id ${this.ffmpeg_exec.pid}`);
    global.sessions.add(this);

    this.ffmpeg_exec.on("error", (e) => {
      Logger.error(e);
    });

    this.ffmpeg_exec.stdout.on("data", (data) => {
      Logger.ffdebug(`IDX - ${data}`);
    });

    this.ffmpeg_exec.stderr.on("data", (data) => {
      Logger.ffdebug(`IDX - ${data}`);
    });

    this.ffmpeg_exec.on("close", (code) => {
      Logger.debug(`Transmuxing end ${code}`);

      // code 255 = clean exit - killed by manager
      if (code !== 255) {
        global.sessions.kill(this.config.id);
      }
    });
  }

  end() {
    return new Promise((resolve, _reject) => {
      try {
        this.ffmpeg_exec.kill();
      } catch {}
      Logger.debug("Killing ffmpeg process", this.ffmpeg_exec.pid);
      resolve();
    });
  }
}

export default FfmpegManager;
