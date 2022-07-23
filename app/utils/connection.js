const mysql = require("mysql2");

// create an sql connection
const connection = mysql.createPool({
  host: process.env.SQL_HOST,
  port: process.env.SQL_PORT,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

module.exports = {
  connection,
};
