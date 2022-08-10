import Logger from "../Logger.js";
import fetch from "node-fetch";

const pushStats = async (cbUrl, streamId, listeners) => {
  fetch(cbUrl, {
    method: "post",
    body: JSON.stringify({
      streamId: streamId,
      listeners: listeners,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((resp) => {
      const status = resp.status;
      if (status !== 200) {
        Logger.warn(
          `Stats callback for stream "${streamId}" - "${cbUrl} returned status code ${status}`
        );
      }
    })
    .catch((err) => {
      Logger.warn(
        `Stats callback for stream "${streamId}" - "${cbUrl} returned an error`
      );
      Logger.debug(err);
    });
};

const doCallback = () => {
  global.sessions?.activeSessions.forEach((sess) => {
    const streamId = sess.id;
    const cbUrl = sess.config.statsUrl;

    if (sess.config.stats && sess.config.statsUrl) {
      const listeners = global.listeners.filter((item) => item.id === streamId);
      const listenersCount = listeners.length;
      Logger.debug(
        `Stats callback for "${streamId}" to URL "${cbUrl}" - ${listenersCount}`
      );

      pushStats(cbUrl, streamId, listenersCount);
    }
  });
};

const statsCallback = () => {
  setInterval(() => {
    doCallback();
  }, 5 * 60000);

  setTimeout(() => {
    doCallback();
  }, 15000); // DBG
};

export default statsCallback;
