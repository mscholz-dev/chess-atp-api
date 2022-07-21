require("dotenv").config();

// database config
module.exports = {
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.PORT,
  https_server: {
    enable_https: false,
  },
};
