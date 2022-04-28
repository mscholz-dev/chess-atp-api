const { jwtDecoded, jwtSecure, cookieSettings } = require("../utils/cookie");
const { connection } = require("../utils/connection");
const xss = require("xss");
const moment = require("moment");

class GameController {
  async index(req, res) {
    try {
      // update cookie data
      const cookieData = jwtDecoded(req.cookies.user);
      connection.query("SELECT id, avatar, email, username, role, language FROM user WHERE id = ?", [cookieData.id], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.clearCookie("user").json({ state: false });

        const jwtData = jwtSecure({
          id: rows[0].id,
          avatar: rows[0].avatar,
          email: rows[0].email,
          username: rows[0].username,
          role: rows[0].role,
          language: rows[0].language,
        });

        res.cookie("user", jwtData, cookieSettings).json({ state: true, data: cookieData, role: rows[0].role });
      });
    } catch (err) {
      throw err;
    }
  }

  async enemy(req, res) {
    try {
      const cookieData = jwtDecoded(req.cookies.user);

      connection.query("SELECT player_one_id, player_two_id FROM game WHERE player_one_id = ? OR player_two_id = ? ORDER BY id DESC LIMIT 1", [cookieData.id, cookieData.id], (err, rows) => {
        if (err) throw err;

        if (!rows[0]) return res.json({ state: false, description: "game not found" });

        const enemyId = rows[0].player_one_id !== cookieData.id ? rows[0].player_one_id : rows[0].player_two_id;

        connection.query("SELECT avatar, username FROM user WHERE id = ?", [enemyId], (err, rows) => {
          if (err) throw err;

          if (!rows[0]) return res.json({ state: false, description: "enemy not found" });

          res.json({
            state: true,
            data: {
              avatar: rows[0].avatar,
              username: rows[0].username,
            },
          });
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async history(req, res) {
    try {
      const cookieData = jwtDecoded(req.cookies.user);
      const cookieId = cookieData.id;
      const searchParam = xss(req.body.search);

      if (searchParam) {
        connection.query("SELECT game.id, user.username, game.player_one_id, game.player_two_id, game_score.score FROM game INNER JOIN user ON (game.player_one_id = user.id OR game.player_two_id = user.id) INNER JOIN game_score ON game.id = game_score.game_id WHERE (game.player_one_id = ? OR game.player_two_id = ?) AND user.id != ? AND user.username LIKE ? ORDER BY id DESC LIMIT 20;", [cookieId, cookieId, cookieId, `%${searchParam}%`], (err, rows) => {
          if (err) throw err;
          res.json({ state: true, data: rows, id: cookieId });
        });
        return;
      }

      connection.query("SELECT game.id, user.username, game.player_one_id, game.player_two_id, game_score.score FROM game INNER JOIN user ON (game.player_one_id = user.id OR game.player_two_id = user.id) INNER JOIN game_score ON game.id = game_score.game_id WHERE (game.player_one_id = ? OR game.player_two_id = ?) AND user.id != ? ORDER BY id DESC LIMIT 20;", [cookieId, cookieId, cookieId], (err, rows) => {
        if (err) throw err;
        res.json({ state: true, data: rows, id: cookieId });
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = GameController;
