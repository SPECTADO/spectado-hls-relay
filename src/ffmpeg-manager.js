// import EventEmitter from "events";
import { spawn } from "child_process";
import Logger from "./Logger.js";
import config from "./config.js";
import mkdirp from "mkdirp";
import fs from "fs";
import generateServerId from "./helpers/serverUuid.js";
import { pushFileToCloudflareR2 } from "./helpers/cloudflareR2.js";

const watchdogInterval = 10000;
const segmentMinPlaces = 4;
const machineId = generateServerId();

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
    this.hlsInitUploaded = false;
  }

  creatFfmpegConfig(hlsPath) {
    let argv = [];

    argv.push("-loglevel");
    argv.push("info");
    // argv.push("-fflags");argv.push("nobuffer");
    // argv.push("-flags"); argv.push("low_delay");
    // argv.push("-stream_loop"); //argv.push("-1");

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
    argv.push("-map_metadata:g");
    argv.push("-1");
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
    argv.push(`${hlsPath}/segment-%${segmentMinPlaces}d.m4s`);
    //argv.push("-lhls");argv.push("1");
    argv.push("-hls_flags");
    argv.push(
      "delete_segments+omit_endlist+discont_start+append_list" //+program_date_time
    );
    argv.push(`${hlsPath}/playlist.m3u8`);

    return argv;
  }

  creatPrerollFfmpegConfig(hlsPath, prerollKey, prerollFile) {
    let argv = [];
    argv.push("-re");
    argv.push("-i");
    argv.push(prerollFile);
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
    argv.push("-map_metadata:g");
    argv.push("-1");
    argv.push("-f");
    argv.push("hls");
    argv.push("-hls_segment_type");
    argv.push("fmp4");
    argv.push("-hls_time");
    argv.push(999);
    argv.push("-hls_segment_filename");
    argv.push(`${hlsPath}/preroll-${prerollKey}.m4s`);
    argv.push("-hls_fmp4_init_filename");
    argv.push(`preroll-${prerollKey}-init.mp4`);
    argv.push("-hls_flags");
    argv.push("single_file");
    argv.push(`${hlsPath}/preroll-${prerollKey}.m3u8`);

    return argv;
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
    if (this.config.preroll) {
      const prerollKeys = Object.keys(this.config.preroll);
      if (prerollKeys.length > 0) {
        prerollKeys.forEach((prerollKey) => {
          const prerollFile = this.config.preroll[prerollKey];

          const argv_spot = this.creatPrerollFfmpegConfig(
            hlsPath,
            prerollKey,
            prerollFile
          );

          const preroll_ffmpeg_exec = spawn(config.ffmpeg, argv_spot);
          Logger.debug(
            `Creating pre-roll spot for stream "${this.config.id}" - "${prerollKey}".`
          );
          Logger.ffdebug(config.ffmpeg, argv_spot.join(" "));

          preroll_ffmpeg_exec.on("error", (e) => {
            Logger.error(e);
          });

          preroll_ffmpeg_exec.stderr.on("data", (data) => {
            Logger.ffdebug(`[${this.config.id} - "${prerollKey}"] - ${data}`);
          });

          preroll_ffmpeg_exec.on("close", (code) => {
            Logger.info(
              `Transmuxing pre-roll "${this.config.id}" - "${prerollKey}" ended (code ${code}).`
            );

            // check the m3u8 file for #EXT-X-TARGETDURATION:0 and if so, remove the preroll files
            const prerollPlaylistPath = `${hlsPath}/preroll-${prerollKey}.m3u8`;
            const prerollAudioFilePath = `${hlsPath}/preroll-${prerollKey}.m4s`;
            fs.readFile(prerollPlaylistPath, "utf8", (err, data) => {
              if (err) {
                Logger.error(err);
                return;
              }
              if (data.includes("#EXT-X-TARGETDURATION:0")) {
                fs.unlink(prerollPlaylistPath, (err) => {
                  if (err) {
                    Logger.error(err);
                    return;
                  }
                  Logger.warn(
                    `Removed pre-roll playlist file "${prerollPlaylistPath}"`
                  );
                });
                fs.unlink(prerollAudioFilePath, (err) => {
                  if (err) {
                    Logger.error(err);
                    return;
                  }
                  Logger.warn(
                    `Removed pre-roll audio file "${prerollAudioFilePath}"`
                  );
                });
              }
            });
          });
        });
      }
    }
    // preroll [end]

    // build FFMPEG arguments - LIVE
    const argv = this.creatFfmpegConfig(hlsPath);

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

    this.ffmpeg_exec.stderr.on("data", async (data) => {
      const output = data.toString();
      //Logger.debug("-------", output);

      if (output.includes("Opening")) {
        const match = output.match(/Opening '(.+?)'/);
        if (match && match[1].endsWith(".m4s")) {
          const cdnUploader = this.config.cdnUploader;
          let filepath = match[1];
          filepath = filepath.replace(/segment-(\d+)\.m4s$/, (_, num) => {
            const newNum = String(num - 1).padStart(segmentMinPlaces, "0");
            return `segment-${newNum}.m4s`;
          });

          const streamId = this.config.id;

          if (cdnUploader === machineId) {
            //Logger.debug(`[HLS segment] ${streamId} - ${filepath}`);

            if (this.hlsInitUploaded !== true) {
              const filepathInit = filepath.replace(
                /segment-\d+\.m4s$/,
                "init.mp4"
              );
              const success = await pushFileToCloudflareR2(
                streamId,
                filepathInit
              );
              if (success) this.hlsInitUploaded = true;
            }

            if (filepath.endsWith(".m4s")) {
              const filepathPlaylist = filepath.replace(
                /segment-\d+\.m4s$/,
                "playlist.m3u8"
              );
              await pushFileToCloudflareR2(streamId, filepathPlaylist);
            }

            await pushFileToCloudflareR2(streamId, filepath);
          }
        }
      }
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
