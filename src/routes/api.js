import express from "express";
import serverInfo from "../api/serverInfo.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.send("spectado-hls-server");
});

router.route("/info").get((_req, res) => {
  res.json(serverInfo());
});

export default router;
