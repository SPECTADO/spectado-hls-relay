import express from "express";

import config from "../config.js";

const router = express.Router();

router.use("/", express.static(config.hls.root));

export default router;
