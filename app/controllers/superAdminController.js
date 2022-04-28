const xss = require("xss");
const { connection } = require("../utils/connection");
const { sendEmail, subjects } = require("../utils/mail");
const emailTemplate = require("../emails/emailTemplate");
const fs = require("fs");
const { emailRegex } = require("../utils/mail");
const { removeAvatar } = require("../utils/img");
const path = require("path");
const bcrypt = require("bcrypt-nodejs");
const { currentDatetime } = require("../utils/date");
const exifTransformer = require("exif-be-gone");

class SuperAdminController {
  async adminDelete(req, res) {
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

  async adminsSearch(req, res) {
    try {
      const username = xss(req.body.username);
      let paging = ((xss(req.body.paging) || 0) - 1) * 10;

      connection.query("SELECT avatar, username FROM user WHERE username LIKE ? AND role = ? ORDER BY id DESC LIMIT 10 OFFSET ?", [`%${username}%`, "admin", paging], (err, rows) => {
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

        connection.query("SELECT COUNT(id) as count FROM user WHERE role = ? AND username LIKE ?", ["admin", `%${username}%`], (err, rows) => {
          if (err) throw err;
          res.json({ state: true, data: array, count: rows[0].count });
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async statsUsersNumber(req, res) {
    try {
      connection.query("SELECT COUNT(id) as number,role,  MONTH(created_at) as month FROM user GROUP BY month, role", [], (err, rows) => {
        if (err) throw err;
        const array = [];

        for (const row of rows) {
          let added = false;

          // verify if id exist
          for (let i = 0; i < array.length; i++) {
            if (array[i].id === row.month) {
              switch (row.role) {
                case "client":
                  array[i].client = row.number;
                  break;

                case "admin":
                  array[i].admin = row.number;
                  break;

                case "superAdmin":
                  array[i].superAdmin = row.number;
                  break;

                default:
                  break;
              }

              added = true;
              break;
            }
          }

          if (!added) {
            switch (row.role) {
              case "client":
                array.push({
                  id: row.month,
                  client: row.number,
                });
                break;

              case "admin":
                array.push({
                  id: row.month,
                  admin: row.number,
                });
                break;

              case "superAdmin":
                array.push({
                  id: row.month,
                  superAdmin: row.number,
                });
                break;

              default:
                break;
            }
          }
        }

        res.json({ state: true, data: array });
      });
    } catch (err) {
      throw err;
    }
  }

  async adminCreate(req, res) {
    try {
      // secure xss failures
      const language = xss(req.body.language);
      const username = xss(req.body.username);
      const email = xss(req.body.email);
      const password = xss(req.body.password);
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

        // is password valid
      } else if (password.length < 12) {
        res.json({ state: false, description: "invalid password" });
        removeAvatar(req);
        return;
      }

      // request to know if username or email already exist
      connection.query("SELECT id FROM user WHERE username = ? OR email = ?", [username, email], (err, rows) => {
        if (err) throw err;

        // is user exist
        if (rows.length !== 0) {
          res.json({ state: false, description: "user already exist" });
          removeAvatar(req);
          return;
        } else {
          let avatarName = null;

          // is the user choose a custom avatar
          if (!req.files.avatar) {
            avatarName = req.body.avatar;
          } else {
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

          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);

          // request to create the user
          connection.query("INSERT INTO user (avatar, username, email, password, role, language, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)", [avatarName, username, email, hash, "admin", language, currentDatetime(), currentDatetime()], (err) => {
            if (err) throw err;
            res.json({ state: true });
          });

          // send a register email to the user
          const emailTpl = emailTemplate({
            headTitle: "Création de compte administrateur",
            name: username,
            subject: "Votre compte administrateur vient d'être créé !",
            message: `Prêt à vaincre vos adversaires ? <br/> Dans ce cas rendez-vous sur <strong><a href="${process.env.FRONT_URL}/game">Chess ATP</a></strong>`,
          });

          sendEmail(email, subjects[lang].register, emailTpl).catch((err) => console.error(err));
        }
      });
    } catch (err) {
      throw err;
    }
  }

  async statsGamesNumber(req, res) {
    try {
      connection.query("SELECT COUNT(game.id) as number, MONTH(game.finished_at) as month FROM game_score INNER JOIN game on game.id = game_score.game_id GROUP BY month", [], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return res.json({ state: true, data: [] });

        res.json({ state: true, data: rows });
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = SuperAdminController;
