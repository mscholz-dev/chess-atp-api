const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");

const searchGameController = (socket, io) => {
  let roomJoined = false;
  // search an existing room to join
  for (const room of socket.adapter.rooms) {
    // is it a game room and only one player inside and not the same player
    if (room[0].indexOf("game:") !== -1 && room[1].size === 1 && !room[1].has(socket.id)) {
      // join an existing game
      socket.join(room[0]);

      // user id in the secure cookie
      const userId = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user).id;

      // update room in db
      connection.query("UPDATE game SET player_two_id = ?, started_at = ?, updated_at = ? WHERE name = ?", [userId, currentDatetime(), currentDatetime(), room[0]], (err) => err && console.error(err));

      // start game for players with numbers
      let playerNumber = 1;
      for (const player of room[1]) {
        io.to(player).emit("game:start", playerNumber);
        playerNumber++;
      }

      roomJoined = true;
      break;
    }
  }

  // create a room
  if (!roomJoined) {
    const currentTime = Date.now();
    socket.join(`game:${currentTime}`);

    // user id in the secure cookie
    const userId = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user).id;

    // create room in db
    connection.query("INSERT INTO game (name, player_one_id, turn, player_one_time_left, player_two_time_left, created_at, updated_at) VALUES (?,?,?,?,?,?,?)", [`game:${currentTime}`, userId, "one", 120, 120, currentDatetime(), currentDatetime()], (err) => err && console.error(err));

    // add loader for player
    socket.emit("game:searching");
  }
};

module.exports = searchGameController;
