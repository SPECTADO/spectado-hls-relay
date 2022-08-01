import fs from "fs";
import Logger from "../Logger.js";
import config from "../config.js";

const fileLifetime = 2; //minutes
const fileLifetimeStale = 10; //minutes

const scanAndClean = (mediaRoot) => {
  const now = new Date().getTime();

  fs.readdir(`${mediaRoot}`, function (err, dirs) {
    if (!err) {
      dirs.forEach((dirname) => {
        try {
          fs.readFileSync(`${mediaRoot}/${dirname}/_lock`);

          try {
            const playlistFile = fs.statSync(
              `${mediaRoot}/${dirname}/playlist.m3u8`
            );

            if (now - playlistFile.mtime > fileLifetimeStale * 60000) {
              Logger.debug("Removing the temp folder > " + dirname);
              try {
                fs.rmSync(`${mediaRoot}/${dirname}`, {
                  recursive: true,
                  force: true,
                });
              } catch {}
            }
          } catch {}
        } catch {
          try {
            const playlistFile = fs.statSync(
              `${mediaRoot}/${dirname}/playlist.m3u8`
            );

            if (now - playlistFile.mtime > fileLifetime * 60000) {
              Logger.debug("Removing the temp folder > " + dirname);
              try {
                fs.rmSync(`${mediaRoot}/${dirname}`, {
                  recursive: true,
                  force: true,
                });
              } catch {}
            }
          } catch {
            Logger.debug("Removing the temp folder > " + dirname);
            try {
              fs.rmSync(`${mediaRoot}/${dirname}`, {
                recursive: true,
                force: true,
              });
            } catch {}
          }
        }

        fs.readdir(`${mediaRoot}/${dirname}`, function (err, files) {
          if (!err) {
            files.forEach((filename) => {
              if (
                filename !== "init.mp4" &&
                filename !== "playlist.m3u8" &&
                filename !== "_lock"
              ) {
                const ftime = fs
                  .statSync(`${mediaRoot}/${dirname}/${filename}`)
                  .mtime.getTime();

                if (now - ftime > fileLifetime * 60000) {
                  try {
                    fs.unlinkSync(`${mediaRoot}/${dirname}/${filename}`, {
                      recursive: true,
                      force: true,
                    });
                    Logger.debug(
                      `Delete stale file from > "${dirname}" > ${filename}`
                    );
                  } catch {}
                }
              }
            });
          }
        });
      });
    }
  });
};

const filesCleanup = () => {
  const mediaRoot = config.hls.root;
  setInterval(() => {
    scanAndClean(mediaRoot);
  }, 60000);

  setTimeout(() => {
    // if (!config.isDev)
    scanAndClean(mediaRoot);
  }, 50);
};

export default filesCleanup;
