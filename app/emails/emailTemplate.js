const fs = require("fs");
const path = require("path");

// email template
const contactEmailTemplate = (data) => {
  try {
    const fileEmailValidation = fs.readFileSync(path.resolve(__dirname, "./templates/email.html"), "utf-8");
    return fileEmailValidation.replace("headTitle", data.headTitle).replace("$name", data.name).replace("$subject", data.subject).replace("$message", data.message);
  } catch (err) {
    return false;
  }
};

module.exports = contactEmailTemplate;
