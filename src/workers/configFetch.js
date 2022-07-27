//import fs from "fs";
import fetch from "node-fetch";
import Logger from "../Logger.js";
import config from "../config.js";

const doFetchConfig = async () => {
  try {
    const response = await fetch(config.streamSource);
    const streams = await response.json();
    const streamsIds = streams.reduce((ret, item) => [...ret, item.id], []);

    const currentStreams = []; //TODO - read from global store...
    const currentStreamsIds = currentStreams.reduce(
      (ret, item) => [...ret, item.name],
      []
    );

    const streamsToRemove = currentStreamsIds.filter(
      (id) => !streamsIds.includes(id)
    );

    // Logger.log(streamsIds); Logger.log(currentStreamsIds); Logger.log(streamsToRemove);

    // Remove all streams that are no longer in the config file...
    streamsToRemove.forEach((stream) => {
      // remove the stream
      Logger.info(`Removing old stream - ${stream}`);
      // TODO: ...
    });

    // find new / updated streams in config
    streams.forEach((stream) => {
      if (currentStreamsIds.includes(stream.id)) {
        // update existing stream
        // check if st6ream needs to be updated...
        Logger.info(`Update stream - ${stream.id}`);
        //TODO: ...
      } else {
        // create a new stream
        Logger.info(`New stream added - ${stream.id}`);
        //TODO:...
      }
    });
  } catch (err) {
    Logger.error(`Error fetching remote config from ${streamConfig}`);
    Logger.error(err);
  }
};

const configFetch = () => {
  setInterval(() => {
    doFetchConfig();
  }, 15000);

  setTimeout(() => doFetchConfig(), 1000);
};

export default configFetch;
