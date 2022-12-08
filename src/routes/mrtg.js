import express from "express";
//import fs from "fs";
import serverInfo from "../api/serverInfo.js";

const router = express.Router();

//router.all("*", (_req, res, next) => {res.header("content-type", "text/plain; charset=utf-8");next();});

router.get("/", (_req, res) => {
  res.send("spectado-hls-server");
});

router.route("/load").get(async (req, res) => {
  const info = serverInfo();
  const load = info.load.toString();

  res.send(`${load}\r\n${load}\r\nload %\r\nNetwork load in %`);
});

router.route("/listeners").get(async (req, res) => {
  const info = serverInfo();
  const listeners = info.listeners.toString();

  res.send(
    `${listeners}\r\n${listeners}\r\nlisteners\r\nCurrent listeners count`
  );
});

router.route("/traffic").get(async (req, res) => {
  const info = serverInfo();

  res.send(
    `${info.eth.tx}\r\n${info.eth.rx}\r\Mbps\r\nCurrent traffic in Mbps`
  );
});

export default router;
