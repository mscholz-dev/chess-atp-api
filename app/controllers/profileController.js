const { jwtDecoded, jwtSecure, cookieSettings } = require("../utils/cookie");
const xss = require("xss");
const { connection } = require("../utils/connection");
const { currentDatetime } = require("../utils/date");
const { removeAvatar } = require("../utils/img");
const emailTemplate = require("../emails/emailTemplate");
const { emailRegex } = require("../utils/mail");
const ip = require("ip");
const fs = require("fs");
const { sendEmail, subjects } = require("../utils/mail");
const exifTransformer = require("exif-be-gone");
const path = require("path");

class ProfileController {
  async index(req, res) {
    try {
      const username = xss(req.body.username);

      connection.query("SELECT avatar, created_at, updated_at FROM user WHERE username = ?", [username], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.json({ state: false });
        return res.json({ state: true, username: username, imgSrc: rows[0].avatar, createDate: rows[0].created_at, lastConnection: rows[0].updated_at });
      });
    } catch (err) {
      throw err;
    }
  }

  async username(req, res) {
    try {
      const cookieData = jwtDecoded(req.cookies.user);
      res.json({ state: true, username: cookieData.username });
    } catch (err) {
      throw err;
    }
  }

  async history(req, res) {
    try {
      const username = xss(req.body.username);
      const search = xss(req.body.search);

      connection.query("SELECT id FROM user WHERE username = ?", [username], (err, rows) => {
        if (err) throw err;
        if (!rows[0]) return res.json({ state: false });
        const userId = rows[0].id;

        if (search) {
          connection.query("SELECT game.id, user.username, game.player_one_id, game.player_two_id, game_score.score FROM game INNER JOIN user ON (game.player_one_id = user.id OR game.player_two_id = user.id) INNER JOIN game_score ON game.id = game_score.game_id WHERE (game.player_one_id = ? OR game.player_two_id = ?) AND user.id != ? AND user.username LIKE ? ORDER BY id DESC LIMIT 20;", [userId, userId, userId, `%${search}%`], (err, rows) => {
            if (err) throw err;
            res.json({ state: true, data: rows, id: userId });
          });
          return;
        }

        connection.query("SELECT game.id, user.username, game.player_one_id, game.player_two_id, game_score.score FROM game INNER JOIN user ON (game.player_one_id = user.id OR game.player_two_id = user.id) INNER JOIN game_score ON game.id = game_score.game_id WHERE (game.player_one_id = ? OR game.player_two_id = ?) AND user.id != ? ORDER BY id DESC LIMIT 20;", [userId, userId, userId], (err, rows) => {
          if (err) throw err;
          res.json({ state: true, data: rows, id: userId });
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async data(req, res) {
    try {
      // username data and cookie data
      const usernameData = xss(req.body.username);
      const cookieData = jwtDecoded(req.cookies.user);

      // is it the same user than the cookie user
      if (usernameData !== cookieData.username) return res.json({ state: false });

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

        res.cookie("user", jwtData, cookieSettings).json({
          state: true,
          role: rows[0].role,
          data: {
            avatar: rows[0].avatar,
            email: rows[0].email,
            username: rows[0].username,
            language: rows[0].language,
          },
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async update(req, res) {
    try {
      const cookieData = jwtDecoded(req.cookies.user);

      // verify user
      connection.query("SELECT id FROM user WHERE username = ? AND email = ?", [cookieData.username, cookieData.email], (err, rows) => {
        if (err) throw err;

        // if no data or not the great user
        if (!rows.length || cookieData.id !== rows[0].id) return res.json({ state: false, description: "false user" });
        const language = xss(req.body.language);
        const username = xss(req.body.username);
        const email = xss(req.body.email);
        const lang = "fr";

        //is username valid
        if (username.length < 6 || username.length > 255) {
          res.json({ state: false, description: "invalid username" });
          removeAvatar(req);
          return;

          // is email valid
        } else if (email.length === 0 || email.length > 255 || !emailRegex.test(email)) {
          res.json({ state: false, description: "invalid email" });
          removeAvatar(req);
          return;
        }

        connection.query("SELECT id, username, email, avatar FROM user WHERE username = ? OR email = ?", [username, email], (err, rows) => {
          if (err) throw err;

          // is user exist
          if (rows.length > 1 || (rows.length === 1 && rows[0].id !== cookieData.id)) {
            res.json({ state: false, description: "user already exist" });
            removeAvatar(req);
            return;
          } else {
            let avatarName = null;

            // is the user choose a custom avatar
            if (!req.files.avatar) {
              avatarName = cookieData.avatar;
            } else {
              // remove old avatar
              fs.unlinkSync(`uploads/${rows[0].avatar}`);

              const filename = req.files.avatar[0].filename;

              // is avatar valid
              if (path.extname(filename).toUpperCase() !== ".JPG" && path.extname(filename).toUpperCase() !== ".JPEG" && path.extname(filename).toUpperCase() !== ".PNG") {
                removeAvatar(req);
                res.json({ state: false, description: "invalid avatar" });
                return;
              }

              // remove exif metada
              avatarName = `no_exif_${filename}`;

              const oldFilePath = `uploads/${filename}`;
              const newFilePath = `uploads/${avatarName}`;

              const reader = fs.createReadStream(oldFilePath);
              reader.on("end", () => fs.unlinkSync(oldFilePath));

              const writer = fs.createWriteStream(newFilePath);
              reader.pipe(new exifTransformer()).pipe(writer);
            }

            connection.query("UPDATE user SET avatar = ?, username = ?, email = ?, language = ?, updated_at = ? WHERE id = ?", [avatarName, username, email, language, currentDatetime(), cookieData.id], (err, rows) => {
              if (err) throw err;

              // create a secure jwt
              const jwtData = jwtSecure({
                id: cookieData.id,
                avatar: avatarName,
                email: email,
                username: username,
                role: cookieData.role,
                language: language,
              });

              // create a server side secure cookie to the user
              res.cookie("user", jwtData, cookieSettings).json({ state: true });
            });

            // request to know if it is a new IP address
            connection.query("SELECT ip_address FROM ip_address WHERE user_id = ?", [cookieData.id], (err, ipRows) => {
              if (err) throw err;

              for (const row of ipRows) {
                // is IP address is different
                const ipAddress = ip.address();
                if (row.ip_address !== ipAddress) {
                  // request to save the IP address of the user
                  connection.query("INSERT INTO ip_address (user_id, ip_address) VALUES (?, ?)", [cookieData.id, ip.address()], (err) => {
                    if (err) throw err;
                  });

                  // send an informative email to the user
                  const emailTpl = emailTemplate({
                    headTitle: "Nouvelle connexion",
                    name: rows[0].username,
                    subject: `Une nouvelle connexion à votre compte sous l'IP ${ipAddress} a été détecté !`,
                    message: `Ce n'est pas vous ? <br/> Contactez un administrateur ou écrivez à mscholz.dev@gmail.com`,
                  });

                  sendEmail("mscholz.dev@gmail.com", subjects[lang].register, emailTpl).catch((err) => console.log(err));
                }
              }
            });
          }
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async search(req, res) {
    try {
      const username = xss(req.body.username);
      const array = [];
      connection.query("SELECT avatar, username FROM user WHERE username LIKE ? LIMIT 10", [`%${username}%`], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.json({ state: true, data: array });
        let i = 0;
        for (const row of rows) {
          array.push({
            id: i,
            avatar: row.avatar,
            username: row.username,
          });
          i++;
        }

        res.json({
          state: true,
          data: array,
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async statsGamesNumber(req, res) {
    try {
      const username = xss(req.body.username);

      connection.query("SELECT COUNT(game.id) as number, game_score.score, day(game.finished_at) as day, game.player_one_id as playerOne, user.id as userId FROM game INNER JOIN user ON game.player_one_id = user.id OR game.player_two_id = user.id INNER JOIN game_score ON game.id = game_score.game_id WHERE user.username = ? GROUP BY day, game_score.score, game.player_one_id, userId", [username], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.json({ state: true, data: [] });

        const array = [];
        const dayStocked = [];

        // group by day
        for (const { number, day, score, userId, playerOne } of rows) {
          let dayNumber = null;
          // day already stocked
          for (let i = 0; i < dayStocked.length; i++) {
            if (parseInt(dayStocked[i]) === day) {
              dayNumber = { day, i };
              break;
            }
          }

          if (dayNumber) {
            switch (score) {
              case "0 - 1":
                if (playerOne === userId) {
                  array[dayNumber.i].loose += number;
                } else {
                  array[dayNumber.i].win += number;
                }
                break;
              case "1 - 0":
                if (playerOne === userId) {
                  array[dayNumber.i].win += number;
                } else {
                  array[dayNumber.i].loose += number;
                }
                break;
              case "0.5 - 0.5":
                array[dayNumber.i].equality += number;
                break;
              default:
                break;
            }
          } else {
            switch (score) {
              case "0 - 1":
                if (playerOne === userId) {
                  array.push({
                    day: day,
                    win: 0,
                    equality: 0,
                    loose: number,
                  });
                } else {
                  array.push({
                    day: day,
                    win: number,
                    equality: 0,
                    loose: 0,
                  });
                }
                break;
              case "1 - 0":
                if (playerOne === userId) {
                  array.push({
                    day: day,
                    win: number,
                    equality: 0,
                    loose: 0,
                  });
                } else {
                  array.push({
                    day: day,
                    win: 0,
                    equality: 0,
                    loose: number,
                  });
                }
                break;
              case "0.5 - 0.5":
                array.push({
                  day: day,
                  win: 0,
                  equality: number,
                  loose: 0,
                });
                break;
              default:
                break;
            }
            dayStocked.push(day);
          }
        }

        res.json({ state: true, data: array });
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = ProfileController;
