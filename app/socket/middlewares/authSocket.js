const { cookieParsing } = require("../../utils/cookie");
const { jwtVerify, jwtDecoded } = require("../../utils/cookie");
const { currentDatetime } = require("../../utils/date");
const { connection } = require("../../utils/connection");

const authSocket = (socket, next) => {
  // get the secure user cookie
  const brutCookie = socket.handshake.headers.cookie;

  if (!brutCookie) return;

  const userCookie = cookieParsing(brutCookie).user;

  // if cookie invalid
  if (!jwtVerify(userCookie)) return socket.disconnect();

  // verify existence and update updated_at
  const { id } = jwtDecoded(userCookie);

  connection.query("SELECT id, avatar, email, username, role FROM user WHERE id = ?", [id], (err, rows) => {
    if (err) throw err;
    if (!rows.length) return socket.disconnect();

    connection.query("UPDATE user SET updated_at = ? WHERE id = ?", [currentDatetime(), id], (err) => {
      if (err) throw err;
      return next();
    });
  });
};

module.exports = authSocket;
