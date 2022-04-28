const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");
const xss = require("xss");

const movingGameController = (socket, arg) => {
  // search room
  for (const room of socket.adapter.rooms) {
    // if player is in this room
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      // data
      const piece = xss(arg.piece) || 0;
      const prevPos = xss(arg.prevPos) || 0;
      const newPos = xss(arg.newPos) || 0;
      const eatenPiece = xss(arg.eatenPiece) || 0;
      const turn = xss(arg.turn) || 0;
      const checkValue = xss(arg.checkValue) || 0;
      const checkmateValue = xss(arg.checkmateValue) || 0;
      const stalemateValue = xss(arg.stalemateValue) || 0;
      const timeLeft = xss(arg.timeLeft) || 0;

      // user id in the secure cookie
      const userId = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user).id;

      connection.query("SELECT id from game WHERE name = ?", [room[0]], (err, rows) => {
        if (err) console.error(err);
        const game_id = rows[0].id;

        let gameTurn;
        if (turn === 1) {
          gameTurn = "one";
        } else {
          gameTurn = "two";
        }

        if (turn !== 1) {
          // change game turn and time for player two
          connection.query("UPDATE game SET turn = ?, updated_at = ?, player_one_time_left = ? WHERE id = ?", [gameTurn, currentDatetime(), timeLeft - 1, game_id], (err) => err && console.error(err));
        } else {
          // change game turn and time for player one
          connection.query("UPDATE game SET turn = ?, updated_at = ?, player_two_time_left = ? WHERE id = ?", [gameTurn, currentDatetime(), timeLeft - 1, game_id], (err) => err && console.error(err));
        }

        let eatenValue = eatenPiece ? true : false;

        connection.query("INSERT INTO game_move (game_id, player_id, piece, prev_pos, new_pos, eating, checking, checkmating, stalemating, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)", [game_id, userId, piece, prevPos, newPos, eatenValue, checkValue, checkmateValue, stalemateValue, currentDatetime()], (err) => err && console.error(err));
      });

      if (eatenPiece) {
        socket.to(room).emit("game:eat", { piece, prevPos, newPos, eatenPiece });
      } else {
        socket.to(room).emit("game:move", { piece, prevPos, newPos });
      }

      break;
    }
  }
};

module.exports = movingGameController;
