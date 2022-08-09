import dayjs from "dayjs";
//import Logger from "../Logger.js";

const doCleanup = () => {
  global.listenersCleanup.forEach((ic) => {
    const id = ic.id;
    const date = ic.date;

    if (dayjs().isAfter(date)) {
      global.listeners = global.listeners.filter((item) => item.id !== id);
      global.listenersCleanup = global.listenersCleanup.filter(
        (item) => item.id !== id
      );
    }
  });
};

const statsCleanup = () => {
  setInterval(() => {
    doCleanup();
  }, 60000);
};

export default statsCleanup;
