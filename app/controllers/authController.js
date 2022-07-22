const bcrypt = require("bcrypt-nodejs");
const { connection } = require("../utils/connection");
const { currentDatetime } = require("../utils/date");
const xss = require("xss");
const { sendEmail, subjects } = require("../utils/mail");
const emailTemplate = require("../emails/emailTemplate");
const ip = require("ip");
const fs = require("fs");
const { emailRegex } = require("../utils/mail");
const path = require("path");
const exifTransformer = require("exif-be-gone");
const { removeAvatar } = require("../utils/img");
const { jwtSecure, jwtDecoded } = require("../utils/cookie");

class AuthController {
  async index(req, res) {
    try {
      // update cookie data
      const cookieData = jwtDecoded(req.session.user);
      connection.query("SELECT id, avatar, email, username, role, language FROM user WHERE id = ?", [cookieData.id], (err, rows) => {
        if (err) throw err;
        if (!rows.length) return; // TODO destroy session

        const jwtData = jwtSecure({
          id: rows[0].id,
          avatar: rows[0].avatar,
          email: rows[0].email,
          username: rows[0].username,
          role: rows[0].role,
          language: rows[0].language,
        });

        // update session cookie
        req.session = jwtData;

        // response
        res.json({ state: true, role: rows[0].role, language: rows[0].language });
      });
    } catch (err) {
      throw err;
    }
  }

  async register(req, res) {
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
          connection.query("INSERT INTO user (avatar, username, email, password, role, language, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)", [avatarName, username, email, hash, "client", language, currentDatetime(), currentDatetime()], (err) => {
            if (err) throw err;
          });

          // request to have the user id
          connection.query("SELECT id, avatar, email, username, role, language FROM user WHERE username = ?", [username], (err, rows) => {
            if (err) throw err;

            // request to save the IP address of the user
            connection.query("INSERT INTO ip_address (user_id, ip_address) VALUES (?, ?)", [rows[0].id, ip.address()], (err) => {
              if (err) throw err;
            });

            // create a secure jwt
            const jwtData = jwtSecure({
              id: rows[0].id,
              avatar: rows[0].avatar,
              email: rows[0].email,
              username: rows[0].username,
              role: rows[0].role,
              language: rows[0].language,
            });

            // update session cookie
            req.session = jwtData;

            // response
            res.json({ state: true });
          });

          // send a register email to the user
          const emailTpl = emailTemplate({
            headTitle: "Création de compte",
            name: username,
            subject: "Votre compte a bien été créé !",
            message: `Prêt à vaincre vos adversaires ? <br/> Dans ce cas rendez-vous sur <strong><a href="${process.env.FRONT_URL}/game">Chess ATP</a></strong>`,
          });

          sendEmail(email, subjects[lang].register, emailTpl).catch((err) => console.error(err));
        }
      });
    } catch (err) {
      throw err;
    }
  }

  async login(req, res) {
    try {
      // secure xss failures
      const email = xss(req.body.email);
      const password = xss(req.body.password);
      const lang = "fr";

      // is email valid
      if (email.length === 0 || email.length > 255 || !emailRegex.test(email)) {
        res.json({ state: false, description: "invalid email" });
        return;

        // is password valid
      } else if (password.length < 12) {
        res.json({ state: false, description: "invalid password" });
        return;
      }

      // request to know if the user exist
      connection.query("SELECT id, avatar, username, email, password, role, language FROM user WHERE email = ?", [email], (err, rows) => {
        if (err) throw err;

        // is user exist
        if (rows.length === 0) {
          res.json({ state: false, description: "user not found" });
          return;
        } else {
          // request to know if it is a new IP address
          connection.query("SELECT ip_address FROM ip_address WHERE user_id = ?", [rows[0].id], (err, ipRows) => {
            if (err) throw err;

            for (const row of ipRows) {
              // is IP address is different
              const ipAddress = ip.address();
              if (row.ip_address !== ipAddress) {
                // request to save the IP address of the user
                connection.query("INSERT INTO ip_address (user_id, ip_address) VALUES (?, ?)", [rows[0].id, ip.address()], (err) => {
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

          const hash = rows[0].password;
          const compareHash = bcrypt.compareSync(password, hash);

          // is the password correct
          if (compareHash) {
            // create a secure jwt
            const jwtData = jwtSecure({
              id: rows[0].id,
              avatar: rows[0].avatar,
              email: rows[0].email,
              username: rows[0].username,
              role: rows[0].role,
              language: rows[0].language,
            });

            // update session cookie
            req.session = jwtData;

            // response
            res.json({ state: true });
          } else {
            res.json({ state: false, description: "invalid password" });
          }
        }
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AuthController;
