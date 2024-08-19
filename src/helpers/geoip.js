import maxmind from "maxmind";
import fs from "fs";
import Logger from "../Logger.js";

const dbPath = "./_temp/GeoLite2-Country.mmdb";

export const getCountryFromIp = async (ip) => {
  try {
    if (fs.existsSync(dbPath) !== true) {
      Logger.debug("[GeoIP] - getCountryFromIp - db not found");
      return "NaN";
    }

    const lookup = await maxmind.open(dbPath);
    const country = lookup.get(ip);

    return country?.country?.iso_code?.toString()?.toLowerCase() || "NaN";
  } catch (err) {
    Logger.error("[GeoIP] - getCountryFromIp error", { err });
    return "NaN";
  }
};

export const checkGeoIp = async () => {
  try {
    if (fs.existsSync(dbPath) !== true) {
      Logger.debug("[GeoIP] - getCountryFromIp - db not found");
      return false;
    }

    const lookup = await maxmind.open(dbPath);
    const country = lookup.get("8.8.8.8");

    const test = country?.country?.iso_code?.toString()?.toLowerCase() || "NaN";
    if (test === "NaN") return false;

    return true;
  } catch (err) {
    Logger.error("[GeoIP] - getCountryFromIp error", { err });
    return false;
  }
};
