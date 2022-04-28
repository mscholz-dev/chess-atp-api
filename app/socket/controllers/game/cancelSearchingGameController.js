const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");

const cancelSearchingGameController = (socket, io) => {
  for (const room of socket.adapter.rooms) {
    // is it a game room and only one player inside and the same player
    if (room[0].indexOf("game:") !== -1 && room[1].size === 1 && room[1].has(socket.id)) {
      const cookieData = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user);
      // is game started
      connection.query("SELECT * FROM game WHERE player_one_id = ? OR player_two_id = ? ORDER BY id DESC", [cookieData.id, cookieData.id], (err, rows) => {
        if (err) console.error(err);

        // if game already started return
        if (rows[0] && rows[0].player_two_id) return;

        // delete existing room
        io.to(room).socketsLeave(room);
        socket.emit("game:canceled");

        connection.query("UPDATE game SET updated_at = ?, finished_at = ? WHERE name = ?", [currentDatetime(), currentDatetime(), room[0]], (err) => err && console.error(err));
      });
    }
  }
};

module.exports = cancelSearchingGameController;
