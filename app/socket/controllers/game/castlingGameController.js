const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");
const xss = require("xss");

const castlingGameController = (socket, arg) => {
  // search room
  for (const room of socket.adapter.rooms) {
    // if player is in this room
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      // data
      const king = xss(arg.king) || 0;
      const rook = xss(arg.rook) || 0;
      const turn = xss(arg.turn) || 0;
      const timeLeft = xss(arg.timeLeft) || 0;

      // user id in the secure cookie
      const userId = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user).id;

      connection.query("SELECT id from game WHERE name = ?", [room[0]], (err, rows) => {
        if (err) console.error(err);
        const game_id = rows[0].id;

        let gameTurn;
        if (turn === 1) {
          gameTurn = "two";
        } else {
          gameTurn = "one";
        }

        if (turn === 1) {
          // change game turn and time for player one
          connection.query("UPDATE game SET turn = ?, updated_at = ?, player_one_time_left = ? WHERE id = ?", [gameTurn, currentDatetime(), timeLeft - 1, game_id], (err) => err && console.error(err));
        } else {
          // change game turn and time for player two
          connection.query("UPDATE game SET turn = ?, updated_at = ?, player_two_time_left = ? WHERE id = ?", [gameTurn, currentDatetime(), timeLeft - 1, game_id], (err) => err && console.error(err));
        }

        // define castleName for castle data
        let castleName;
        if (king === 62 && rook === 61) {
          castleName = "castle_right_one";
        } else if (king === 58 && rook === 59) {
          castleName = "castle_left_one";
        } else if (king === 2 && rook === 3) {
          castleName = "castle_left_two";
        } else if (king === 6 && rook === 5) {
          castleName = "castle_right_two";
        }

        connection.query("INSERT INTO game_castle (game_id, player_id, name, created_at) VALUES (?,?,?,?)", [game_id, userId, castleName, currentDatetime()], (err) => err && console.error(err));
      });

      socket.to(room).emit("game:castle", { king, rook });
      break;
    }
  }
};

module.exports = castlingGameController;
