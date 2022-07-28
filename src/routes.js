import express from "express";
import fs from "fs";
import routesBasic from "./routes/basic.js";
import routesApi from "./routes/api.js";
import config from "./config.js";
import Logger from "./Logger.js";

const router = express.Router();

router.use("/", routesBasic);
router.use("/api", routesApi);

router.use("/player", express.static("public"));
router.use("/live", express.static(config.hls.root));

router.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Credentials", true);
  req.method === "OPTIONS" ? res.sendStatus(200) : next();
});

/*
router.param("id", (req, res, next, id) => {
  console.log(id);
  next();
});
*/

export default router;
