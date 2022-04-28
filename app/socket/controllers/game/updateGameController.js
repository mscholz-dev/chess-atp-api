const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");
const xss = require("xss");

const updateGameController = (socket, arg) => {
  // data
  const timerOne = xss(arg.timerOne) || 0;
  const timerTwo = xss(arg.timerTwo) || 0;

  // search room
  for (const room of socket.adapter.rooms) {
    // if player is in this room
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      // update game updated_at and timers
      connection.query("UPDATE game SET updated_at = ?, player_one_time_left = ?, player_two_time_left = ? WHERE name = ?", [currentDatetime(), timerOne, timerTwo, room[0]], (err) => err && console.error(err));
    }
  }
};

module.exports = updateGameController;
