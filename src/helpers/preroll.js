import { globSync } from "glob";
import config from "../config.js";
import Logger from "../Logger.js";
import { getCountryFromRequest } from "./geoip.js";

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

export const getPrerollKey = async (streamName, req) => {
  const allowedPrerollKeys = getAllowedPrerollKeys(streamName);

  const country = await getCountryFromRequest(req);
  const fsProject = req.query.fs_project;
  //Logger.debug("getPrerollKey", { country, fsProject, allowedPrerollKeys });

  if (
    config.allowedProjects &&
    config.allowedProjects?.length > 0 &&
    config.allowedProjects.includes(fsProject) !== true
  )
    return null; // LiveSport stuff

  if (allowedPrerollKeys.includes(`${country}~${fsProject}`)) {
    return `${country}~${fsProject}`;
  }

  if (allowedPrerollKeys.includes(`all~${fsProject}`)) {
    return `all~${fsProject}`;
  }

  if (allowedPrerollKeys.includes(`${country}~all`)) {
    return `${country}~all`;
  }

  return allowedPrerollKeys.includes("all") ? "all" : null;
};
