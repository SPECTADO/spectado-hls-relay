import fs from "fs";
import Logger from "../Logger.js";
//import config from "../config.js";

export const getIpFromRequest = (req) => {
  let ip = req.headers["cf-connecting-ip"] || req.socket.remoteAddress;
  // If the IP is in IPv4-mapped IPv6 format, extract the IPv4 part
  if (ip?.includes("::ffff:")) {
    ip = ip.split("::ffff:")[1];
  }
  return ip;
};

export const getCountryFromRequest = async (req) => {
  try {
    const country = req.headers["cf-ipcountry"] || "NaN";
    //Logger.debug("[GeoIP] - getCountryFromRequest", { country });

    return country?.toLowerCase();
  } catch (err) {
    Logger.error("[GeoIP] - getCountryFromIp error", { err });
    return "NaN";
  }
};
