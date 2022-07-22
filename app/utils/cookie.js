const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const moment = require("moment");

const jwtSecure = (data) => jwt.sign(data, process.env.JWT_SECRET, { mutatePayload: true });

const jwtVerify = (data) => jwt.verify(data, process.env.JWT_SECRET, (err) => !err);

const jwtDecoded = (data) => jwt.verify(data, process.env.JWT_SECRET, (err, decoded) => decoded);

const cookieParsing = (data) => cookie.parse(data);

const cookieSettings = {
  expires: new Date(moment().add(1, "days")),
  path: "/",
  sameSite: "strict",
  secure: true,
  httpOnly: true,
};

module.exports = {
  jwtSecure,
  jwtVerify,
  cookieParsing,
  jwtDecoded,
  cookieSettings,
};
