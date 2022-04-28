const nodemailer = require("nodemailer");

// const imageUrl = `${process.env.API_URL}/app/emails/templates/img`;

const MAIL_TO = process.env.MAILER_USER;

const subjects = {
  fr: {
    register: "Chess ATP - Compte créé",
  },
};

const sendEmail = (emailDest, emailSubject, emailMessageHtml) => {
  return new Promise(async function (resolve, reject) {
    try {
      let transporter = nodemailer.createTransport({
        // pool: true,
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        secure: true,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASSWORD,
        },
      });

      let info = await transporter.sendMail({
        from: process.env.MAILER_FROM, // sender address
        to: emailDest, // list of receivers => 'email@email.com, email@email.com, email@email.com'
        subject: emailSubject, // Subject line
        text: "", // plain text body
        html: emailMessageHtml, // html body
      });

      resolve(info);
    } catch (err) {
      console.log(err);
      reject("Error while sending mail, contact administrator");
    }
  });
};

const emailRegex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");

module.exports = {
  sendEmail: sendEmail,
  // imageUrl,
  MAIL_TO,
  subjects,
  emailRegex,
};
