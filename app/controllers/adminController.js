const xss = require("xss");
const { connection } = require("../utils/connection");

class AdminController {
  async userDelete(req, res) {
    try {
      const username = xss(req.params.username);

      if (!username) return res.json({ state: false });

      connection.query("DELETE FROM user WHERE username = ?", [username], (err) => {
        if (err) throw err;
        res.json({ state: true });
      });
    } catch (err) {
      throw err;
    }
  }

  async usersSearch(req, res) {
    try {
      const username = xss(req.body.username);
      let paging = ((xss(req.body.paging) || 0) - 1) * 10;

      connection.query("SELECT avatar, username FROM user WHERE username LIKE ? AND role = ? ORDER BY id DESC LIMIT 10 OFFSET ?", [`%${username}%`, "client", paging], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.json({ state: true, data: [], count: 0 });

        const array = [];
        let i = 0;

        for (const row of rows) {
          array.push({
            id: i,
            avatar: row.avatar,
            username: row.username,
          });
          i++;
        }

        connection.query("SELECT COUNT(id) as count FROM user WHERE role = ? AND username LIKE ?", ["client", `%${username}%`], (err, rows) => {
          if (err) throw err;
          res.json({ state: true, data: array, count: rows[0].count });
        });
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AdminController;
