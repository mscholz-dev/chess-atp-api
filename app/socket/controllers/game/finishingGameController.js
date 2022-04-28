const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime } = require("../../../utils/date");
const xss = require("xss");

const finishingGameController = (socket, io, arg) => {
  // search room
  for (const room of socket.adapter.rooms) {
    // if player is in this room
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      // get user data
      const cookieData = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user);

      //data
      const equality = xss(arg.equality) || 0;
      const winner = xss(arg.winner) || 0;
      const timerOne = xss(arg.timerOne) || 0;
      const timerTwo = xss(arg.timerTwo) || 0;
      const surrender = xss(arg.surrender) || 0;
      const agreement = xss(arg.agreement) || 0;

      if (surrender) socket.to(room).emit("game:surrender");
      if (agreement) socket.to(room).emit("game:agreement");

      // delete current room
      io.to(room).socketsLeave(room);

      // get game id
      connection.query("SELECT id FROM game WHERE player_one_id = ? OR player_two_id = ? ORDER BY id DESC LIMIT 1", [cookieData.id, cookieData.id], (err, rows) => {
        if (err) console.error(err);

        if (!rows[0]) console.error("empty game id");

        const game_id = rows[0].id;

        let gameScore;
        // if equality
        if (equality) {
          gameScore = "0.5 - 0.5";

          // if player_one_id win
        } else if (winner) {
          gameScore = "1 - 0";

          // if player_two_id loose
        } else {
          gameScore = "0 - 1";
        }

        // create game_score data
        connection.query("INSERT INTO game_score (game_id, score) VALUES (?,?)", [game_id, gameScore], (err) => err && console.error(err));

        // update finished_at for game data
        connection.query("UPDATE game SET finished_at = ?, updated_at = ?, player_one_time_left = ?, player_two_time_left = ? WHERE id = ?", [currentDatetime(), currentDatetime(), timerOne, timerTwo, game_id], (err) => err && console.error(err));
      });
    }
  }
};

module.exports = finishingGameController;
