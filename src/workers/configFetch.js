//import fs from "fs";
import fetch from "node-fetch";
import Logger from "../Logger.js";
import config from "../config.js";
import FfmpegManager from "../ffmpeg-manager.js";

const doFetchConfig = async () => {
  try {
    const response = await fetch(config.streamSource);
    const streams = await response.json();
    const streamsIds = streams.reduce((ret, item) => [...ret, item.id], []);

    const currentStreams = global.sessions.getAll();
    const currentStreamsIds = currentStreams.reduce(
      (ret, item) => [...ret, item.id],
      []
    );

    const streamsToRemove = currentStreamsIds.filter(
      (id) => !streamsIds.includes(id)
    );

    // Logger.log(streamsIds); Logger.log(currentStreamsIds); Logger.log(streamsToRemove);

    // Remove all streams that are no longer in the config file...
    streamsToRemove.forEach((id) => {
      // remove the stream
      Logger.info(`Removing old stream: ${id}`);
      global.sessions.kill(id);
    });

    // find new / updated streams in config
    streams.forEach((stream) => {
      if (currentStreamsIds.includes(stream.id)) {
        // update existing streams...

        const session = global.sessions.get(stream.id);
        if (
          stream.source !== session.config.source ||
          stream.isLive !== session.config.isLive
        ) {
          // only switch if from isLive false->true or true->true.
          if (
            (stream.isLive === true && session.config.isLive === true) ||
            session.config.isLive !== true
          ) {
            Logger.info(`Update stream: ${stream.id} - ${stream.source}`);
            global.sessions.kill(stream.id);
            setTimeout(() => {
              const newStream = new FfmpegManager(stream);
              newStream.start();
            }, 100);
          } else {
            Logger.debug("live -> recording - ignoring stream switch...");
          }
        }
      } else {
        // create a new stream
        Logger.info(`New stream added: ${stream.id} - ${stream.source}`);
        const newStream = new FfmpegManager(stream);
        newStream.start();
      }
    });
  } catch (err) {
    Logger.error(`Error fetching remote config from ${config.streamSource}`);
    Logger.debug(err);
  }
};

const configFetch = () => {
  setInterval(() => {
    doFetchConfig();
  }, 15000);

  setTimeout(() => doFetchConfig(), 1000);
};

export default configFetch;
