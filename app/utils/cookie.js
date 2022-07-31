const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const jwtSecure = (data) => jwt.sign(data, process.env.JWT_SECRET, { mutatePayload: true });

const jwtVerify = (data) => jwt.verify(data, process.env.JWT_SECRET, (err) => !err);

const jwtDecoded = (data) => jwt.verify(data, process.env.JWT_SECRET, (err, decoded) => decoded);

const cookieParsing = (data) => cookie.parse(data);

const cookieSettings = {
  // one week
  maxAge: 1000 * 60 * 60 * 24 * 7,
  expires: 1000 * 60 * 60 * 24 * 7,
  path: "/",
  sameSite: "none",
  secure: true,
  httpOnly: true,
  // domain: process.env.API_URL,
};

module.exports = {
  jwtSecure,
  jwtVerify,
  cookieParsing,
  jwtDecoded,
  cookieSettings,
};
