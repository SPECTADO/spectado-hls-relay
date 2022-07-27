import fs from "fs";
import Logger from "../Logger.js";
import config from "../config.js";

const scanAndClean = (mediaRoot, isStartup) => {
  Logger.info("Cleaning folder " + mediaRoot);
  const now = new Date().getTime();

  fs.readdir(`${mediaRoot}/live`, function (err, dirs) {
    if (!err) {
      dirs.forEach((dirname) => {
        if (isStartup) {
          Logger.info("Removing the temp folder > " + dirname);
          fs.rmSync(`${mediaRoot}/live/${dirname}`, {
            recursive: true,
            force: true,
          });
        }

        if (!isStartup) {
          fs.readdir(`${mediaRoot}/live/${dirname}`, function (err, files) {
            if (!err) {
              files.forEach((filename) => {
                const ftime = fs
                  .statSync(`${mediaRoot}/live/${dirname}/${filename}`)
                  .mtime.getTime();

                if (now - ftime > 60000) {
                  Logger.info(
                    `Delete stale file from > "${dirname}" > ${filename}`
                  );
                  fs.unlinkSync(`${mediaRoot}/live/${dirname}/${filename}`, {
                    recursive: true,
                    force: true,
                  });
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
    scanAndClean(mediaRoot);
  }, 60000 * 5);

  setTimeout(() => {
    scanAndClean(mediaRoot, true);
  }, 100);
};

export default filesCleanup;
