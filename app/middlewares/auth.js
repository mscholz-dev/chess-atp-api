const { jwtVerify, jwtDecoded, jwtSecure, cookieSettings } = require("../utils/cookie");
const { connection } = require("../utils/connection");
const { currentDatetime } = require("../utils/date");

const auth = async (req, res, next) => {
  try {
    const userCookie = req.cookies.user;

    // if cookie invalid
    if (!jwtVerify(userCookie)) return res.clearCookie("user").json({ state: false });

    // verify existence and update updated_at
    const { id } = jwtDecoded(userCookie);

    connection.query("SELECT id, avatar, email, username, role, language FROM user WHERE id = ?", [id], (err, rows) => {
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

      res.cookie("user", jwtData, cookieSettings);

      connection.query("UPDATE user SET updated_at = ? WHERE id = ?", [currentDatetime(), id], (err) => {
        if (err) throw err;
        return next();
      });
    });
  } catch (err) {
    return console.error(err);
  }
};

module.exports = auth;
