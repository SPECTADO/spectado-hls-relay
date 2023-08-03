import { globSync } from "glob";
import config from "../config.js";
import Logger from "../Logger.js";

const getAllowedPrerollKeys = (streamName) => {
  const rootDir = config.hls.root;

  const jsfiles = globSync(`${rootDir}/${streamName}/preroll-*.m4s`, {});
  if (jsfiles && jsfiles?.length > 0) {
    const allowedPrerollKeys = jsfiles.map((path) => {
      return path.split("preroll-")?.at(1)?.replace(".m4s", "");
    });
    return allowedPrerollKeys;
  }
  return [];
};

export const getPrerollKey = (streamName, req) => {
  const allowedPrerollKeys = getAllowedPrerollKeys(streamName);

  // TODO: implement logic for geo + project
  return allowedPrerollKeys.includes("all") ? "all" : null;
};
