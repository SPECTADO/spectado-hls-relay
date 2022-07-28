import express from "express";
import streamsInfo from "../api/streamsInfo.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index", { streams: streamsInfo(req) });
});

export default router;
