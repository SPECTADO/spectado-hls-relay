import fs from "fs";
import Logger from "../Logger.js";
import config from "../config.js";

const mediaRoot = config.hls.root;
const fileLifetimeStale = 15; //minutes
const scheduleInterval = 1; //minutes

const scanAndClean = () => {
  const now = new Date().getTime();
  const validsessions = global.sessions?.activeSessions.reduce(
    (ret, sess) => [...ret, sess.id],
    []
  );

  Logger.debug("Running cleanup job", mediaRoot);

  fs.readdir(`${mediaRoot}`, function (err, dirs) {
    if (err) {
      Logger.error("Cleanup job error", err);
      return false;
    }

    dirs.forEach((currDir) => {
      if (currDir === "_logs") return;

      try {
        const isValidSession = validsessions.includes(currDir);
        if (!isValidSession) {
          // invalid session directory, check if the playlist wasn't modified in the last x minitues...
          const playlistFile = fs.statSync(
            `${mediaRoot}/${currDir}/playlist.m3u8`
          );
          if (now - playlistFile.mtime > fileLifetimeStale * 60 * 1000) {
            Logger.info(
              `Found invalid and stale session directory "${currDir}"`
            );

            try {
              fs.rmSync(`${mediaRoot}/${currDir}`, {
                recursive: true,
                force: true,
              });
            } catch (e) {
              Logger.warn(`Unable to delete session directory "${currDir}"`);
              Logger.debug(e);
            }
          }
        }
      } catch {
        // no playlist in the directory, dedelete it
        Logger.warn(`Invalid session directory found "${currDir}"`);
        try {
          fs.rmSync(`${mediaRoot}/${currDir}`, {
            recursive: true,
            force: true,
          });
        } catch {}
      }
    });
  });
};

const filesCleanup = () => {
  setInterval(() => {
    scanAndClean();
  }, scheduleInterval * 60 * 1000);
};

export default filesCleanup;
