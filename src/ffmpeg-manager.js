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

    // preroll [start]
    /*
    // build FFMPEG arguments - preroll
    let argv_spot = [];
    argv_spot.push("-re");
    argv_spot.push("-i");
    argv_spot.push("./src/assets/preroll.m4a");
    argv_spot.push("-acodec");
    argv_spot.push(config.codec.type);
    argv_spot.push("-ab");
    argv_spot.push(config.codec.bitrate);
    argv_spot.push("-ac");
    argv_spot.push(config.codec.channels);
    argv_spot.push("-ar");
    argv_spot.push(config.codec.sampleRate);
    if (config.codec.normalize) {
      argv_spot.push("-af");
      argv_spot.push("loudnorm=I=-16:LRA=12:TP=-1.5");
    }
    argv_spot.push("-f");
    argv_spot.push("hls");
    argv_spot.push("-hls_segment_type");
    argv_spot.push("fmp4");
    argv_spot.push("-hls_time");
    argv_spot.push(999);
    argv_spot.push("-hls_segment_filename");
    argv_spot.push(`${hlsPath}/preroll-%1d.m4s`);
    argv_spot.push("-hls_fmp4_init_filename");
    argv_spot.push(`preroll-init.mp4`);
    argv_spot.push(`${hlsPath}/preroll.m3u8`);
    // [end] build FFMPEG arguments - preroll
    spawn(config.ffmpeg, argv_spot);
    */
    // preroll [end]

    // build FFMPEG arguments - LIVE
    let argv = [];
    argv.push("-loglevel");
    argv.push("info");
    argv.push("-fflags");
    argv.push("nobuffer");
    argv.push("-flags");
    argv.push("low_delay");
    argv.push("-stream_loop");
    argv.push("-1");
    argv.push("-re");
    argv.push("-i");
    argv.push(this.config.source);
    argv.push("-muxdelay");
    argv.push("1");
    argv.push("-muxpreload");
    argv.push("1");
    argv.push("-acodec");
    argv.push(config.codec.type);
    argv.push("-ab");
    argv.push(config.codec.bitrate);
    argv.push("-ac");
    argv.push(config.codec.channels);
    argv.push("-ar");
    argv.push(config.codec.sampleRate);
    if (config.codec.normalize) {
      argv.push("-af");
      argv.push("loudnorm=I=-16:LRA=12:TP=-1.5");
    }
    argv.push("-f");
    argv.push("hls");
    argv.push("-hls_segment_type");
    argv.push("fmp4");
    argv.push("-segment_list_flags");
    argv.push("live");
    //argv.push("-hls_playlist_type"); argv.push("event");
    argv.push("-hls_time");
    argv.push(config.hls.hlsTime);
    argv.push("-hls_list_size");
    argv.push(config.hls.hlsListSize);
    argv.push("-hls_segment_filename");
    argv.push(`${hlsPath}/s%4d.m4s`);
    argv.push("-lhls");
    argv.push("1");
    argv.push("-hls_flags");
    argv.push(
      "delete_segments+omit_endlist+discont_start+append_list+program_date_time"
    );
    argv.push(`${hlsPath}/playlist.m3u8`);
    // [end] build FFMPEG arguments

    this.ffmpeg_exec = spawn(config.ffmpeg, argv);
    Logger.debug(`Created ffmpeg process with id ${this.ffmpeg_exec.pid}`);
    Logger.ffdebug(config.ffmpeg, argv.join(" "));
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
