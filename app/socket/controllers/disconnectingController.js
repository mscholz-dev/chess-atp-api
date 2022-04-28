const { connection } = require("../../utils/connection");
const { currentDatetime } = require("../../utils/date");

const disconnectingController = (socket) => {
  // search room
  for (const room of socket.adapter.rooms) {
    // if player is in this room
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      // start waiting game
      socket.to(room).emit("game:wait");

      // expluse disconnected socket from the room
      socket.leave(room[0]);

      // if room is empty, close it
      if (room[1].size === 0) {
        return connection.query("UPDATE game SET updated_at = ?, finished_at = ? WHERE name = ?", [currentDatetime(), currentDatetime(), room[0]], (err) => err && console.error(err));
      }

      // update game updated_at
      connection.query("UPDATE game SET updated_at = ? WHERE name = ?", [currentDatetime(), room[0]], (err) => err && console.error(err));
    }
  }
};

module.exports = disconnectingController;
