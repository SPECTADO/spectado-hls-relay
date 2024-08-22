import express from "express";
import fs from "fs";
import serverInfo from "../api/serverInfo.js";
import streamsInfo from "../api/streamsInfo.js";
import {
  checkGeoIp,
  geoipDbPath,
  getCountryFromIp,
  getIpFromRequest,
} from "../helpers/geoip.js";
import config from "../config.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.send("spectado-hls-server");
});

router.route("/info").get(async (req, res) => {
  res.json(serverInfo());
});

router.route("/geoip").get(async (req, res) => {
  const ip = getIpFromRequest(req);
  res.json({
    ip,
    geo: await getCountryFromIp(ip),
    check: await checkGeoIp(),
    geoipDbPath,
    allowedProjects: config.allowedProjects?.join(","),
  });
});

router.route("/streams").get(async (req, res) => {
  res.json(streamsInfo(req));
});

router.route("/changes").get((_req, res) => {
  const md = fs.readFileSync("./CHANGES.md", "utf8");
  res.json({ changes: md });
});

export default router;
