import maxmind from "maxmind";
import fs from "fs";
import Logger from "../Logger.js";

export const geoipDbPath = "./_temp/GeoLite2-Country.mmdb";

export const getIpFromRequest = (req) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // If the IP is in IPv4-mapped IPv6 format, extract the IPv4 part
  if (ip.includes("::ffff:")) {
    ip = ip.split("::ffff:")[1];
  }
  return ip;
};

export const getCountryFromIp = async (ip) => {
  try {
    if (fs.existsSync(geoipDbPath) !== true) {
      Logger.debug("[GeoIP] - getCountryFromIp - db not found");
      return "NaN";
    }

    const lookup = await maxmind.open(geoipDbPath);
    const country = lookup.get(ip);

    return country?.country?.iso_code?.toString()?.toLowerCase() || "NaN";
  } catch (err) {
    Logger.error("[GeoIP] - getCountryFromIp error", { err });
    return "NaN";
  }
};

export const checkGeoIp = async () => {
  try {
    if (fs.existsSync(geoipDbPath) !== true) {
      return "[GeoIP] - getCountryFromIp - db not found";
    }

    const lookup = await maxmind.open(geoipDbPath);
    const country = lookup.get("8.8.8.8");

    const test = country?.country?.iso_code?.toString()?.toLowerCase() || "NaN";
    return test;
  } catch (err) {
    return `[GeoIP] - getCountryFromIp error - ${JSON.stringify(err)}`;
  }
};
