import fs from "fs";
import Logger from "../Logger.js";
import config from "../config.js";

const fileLifetime = 1; //minutes

const scanAndClean = (mediaRoot, isStartup) => {
  const now = new Date().getTime();

  fs.readdir(`${mediaRoot}`, function (err, dirs) {
    if (!err) {
      dirs.forEach((dirname) => {
        if (isStartup) {
          Logger.debug("Removing the temp folder > " + dirname);
          fs.rmSync(`${mediaRoot}/${dirname}`, {
            recursive: true,
            force: true,
          });
        }

        if (!isStartup) {
          fs.readdir(`${mediaRoot}/${dirname}`, function (err, files) {
            if (!err) {
              files.forEach((filename) => {
                if (filename !== "init.mp4") {
                  const ftime = fs
                    .statSync(`${mediaRoot}/${dirname}/${filename}`)
                    .mtime.getTime();

                  if (now - ftime > fileLifetime * 1000) {
                    Logger.debug(
                      `Delete stale file from > "${dirname}" > ${filename}`
                    );
                    fs.unlinkSync(`${mediaRoot}/${dirname}/${filename}`, {
                      recursive: true,
                      force: true,
                    });
                  }
                }
              });
            }
          });
        }
      });
    }
  });
};

const filesCleanup = () => {
  const mediaRoot = config.hls.root;
  setInterval(() => {
    scanAndClean(mediaRoot, false);
  }, 60000);

  setTimeout(() => {
    scanAndClean(mediaRoot, true);
  }, 50);
};

export default filesCleanup;
