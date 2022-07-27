import EventEmitter from "events";
import { spawn } from "child_process";
import Logger from "./Logger.js";
import config from "./config.js";

class FfmpegManager extends EventEmitter {
  constructor(conf) {
    super();
    this.conf = conf;
  }

  start() {
    // TODO: ...

    let argv = [
      "-re",
      "-i",
      "https://icecast-u1.play.cz/beat64.mp3",
      "-c:a",
      "aac",
      "-ab",
      "32k",
      "-ac",
      "1",
      "-ar",
      "44100",
      "-f",
      "hls",
      "-hls_segment_type",
      "fmp4",
      "-segment_list_flags",
      "live",
      "-hls_time",
      "5",
      "-hls_list_size",
      "2",
      "-hls_start_number_source",
      "datetime",
      "-hls_flags",
      "delete_segments+omit_endlist+discont_start+append_list",
      "-var_stream_map",
      "a:0",
      "/Volumes/tmp/test/playlist.m3u8",
    ];

    this.ffmpeg_exec = spawn(config.ffmpeg, argv);

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
      Logger.info(`Transmuxing end ${code}`);
      this.emit("end");
    });
  }

  end() {
    this.ffmpeg_exec.kill();
  }
}

export default FfmpegManager;
