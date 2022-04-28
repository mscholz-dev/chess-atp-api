const moment = require("moment");

// format the current date
const currentDatetime = () => moment().format("YYYY-MM-DD HH:mm:ss");

// format datetime in second
const datetimeInSecond = (date) => new Date(date).getTime() / 1000;

module.exports = {
  currentDatetime,
  datetimeInSecond,
};
