import express from "express";
//import config from "./config.js";
import routesBasic from "./routes/basic.js";
import routesApi from "./routes/api.js";
import routesLive from "./routes/live.js";

// import Logger from "./Logger.js";

const router = express.Router();

router.all("*", (req, res, next) => {
  res.header("X-Powered-By", "spectado-hls-relay");
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header(
    "Cache-Control",
    `max-age:30,s-max-age=15,proxy-revalidate,stale-while-revalidate`
  );

  req.method === "OPTIONS" ? res.sendStatus(200) : next();
});

router.use("/", routesBasic);
router.use("/api", routesApi);
router.use("/live", routesLive);

export default router;
