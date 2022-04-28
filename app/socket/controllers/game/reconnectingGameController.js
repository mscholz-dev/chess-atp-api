const { jwtDecoded, cookieParsing } = require("../../../utils/cookie");
const { connection } = require("../../../utils/connection");
const { currentDatetime, datetimeInSecond } = require("../../../utils/date");

const reconnectingGameController = (socket) => {
  const cookieData = jwtDecoded(cookieParsing(socket.handshake.headers.cookie).user);

  // search last game not finished
  connection.query("SELECT DATE_FORMAT(updated_at, '%Y-%m-%d %k:%i:%s') as updated_at, name, id, player_one_id, player_two_id, turn, player_one_time_left, player_two_time_left FROM game WHERE (player_one_id = ? OR player_two_id = ?) AND finished_at IS NULL ORDER BY id DESC LIMIT 1", [cookieData.id, cookieData.id], (err, rows) => {
    if (err) console.error(err);

    // nothing found
    if (!rows[0]) return;

    // split updated_at to compare it to currentDatetime() value
    const dbDate = datetimeInSecond(rows[0]["updated_at"]);
    const currentDate = datetimeInSecond(currentDatetime());

    // too late to reconnect
    if (currentDate - dbDate > 30) return;

    // add socket to his room
    socket.join(rows[0].name);

    // prevent other player for enemy reconnecting
    socket.to(rows[0].name).emit("game:reconnection");

    // game data variabilisation
    const gameId = rows[0].id;
    const enemyId = rows[0].player_one_id !== cookieData.id ? rows[0].player_one_id : rows[0].player_two_id;
    const playerNumber = rows[0].player_one_id === cookieData.id ? 1 : 2;
    const turn = rows[0].turn === "one" ? 1 : 2;

    let enemyData;
    let movesData;

    // get enemy data
    connection.query("SELECT avatar, username FROM user WHERE id = ?", [enemyId], (err, enemy) => {
      if (err) console.error(err);
      enemyData = enemy;

      // get game moves data
      connection.query("SELECT piece, prev_pos, new_pos, eating, checking, checkmating, stalemating, DATE_FORMAT(created_at, '%Y-%m-%d %k:%i:%s') as created_at FROM game_move WHERE game_id = ?", [gameId], (err, moves) => {
        if (err) console.error(err);
        movesData = moves ? moves : [];

        // get game castles data
        connection.query("SELECT name, DATE_FORMAT(created_at, '%Y-%m-%d %k:%i:%s') as created_at FROM game_castle WHERE game_id = ?", [gameId], (err, castles) => {
          if (err) console.error(err);

          // insert castle in moves data for the client
          for (let i = 0; i < moves.length; i++) {
            if (!castles[0]) break;

            const moveTime = datetimeInSecond(moves[i].created_at);
            const castleTime = datetimeInSecond(castles[0].created_at);

            if (moveTime > castleTime) {
              // add caslte to moves data
              moves.splice(i, 0, castles[0]);

              // delete castle added to moves data
              castles.shift();
            }
          }

          // push last castle in moves data
          if (castles[0]) moves.push(castles[0]);

          // send data to socket who try to reconnect to the game
          socket.emit("game:reconnect", {
            number: playerNumber,
            enemy: enemyData,
            moves: movesData,
            turn,
            timerPlayerOne: rows[0].player_one_time_left,
            timerPlayerTwo: rows[0].player_two_time_left,
          });

          // prevent other player for enemy reconnected
          socket.to(rows[0].name).emit("game:reconnected");

          // updated updated_at data
          connection.query("UPDATE game SET updated_at = ? WHERE id = ?", [currentDatetime(), gameId], (err) => err && console.error(err));
        });
      });
    });
  });
};

module.exports = reconnectingGameController;
