//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////

//REQUEST RESET PASSWORD LINK
_.app.post(r + "/resetpw", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  let status, msg, details;
  console.warn(
    `Somebody started a password change process for user '${req.body.user}'`
  );
  if (req.body.user && req.body.captcha_value) {
    const captchaOk =
      _.cache.get(req.body.captcha_chall) === req.body.captcha_value;
    const captchaExpired = _.cache.get(req.body.captcha_chall) === void 0;
    if (captchaOk) {
      let _user;
      if (req.body.user.includes("@")) {
        const addr = req.body.user.toLowerCase();
        _user = await conn.query(
          `select * from ${
            process.env.DB_USERS_TABL
          } where email = '${req.body.user.toLowerCase()}'`
        );
      } else
        _user = await conn.query(
          `select * from ${process.env.DB_USERS_TABL} where username LIKE '%${req.body.user}%' COLLATE utf8_general_ci`
        );
      //user exist
      if (_user.length) {
        const user = _user[0];
        const activated = user.activated[0] === 1;
        if (!activated) {
          await m.sendRegMail(user.email);
          (status = "ok"), (msg = "registration mail has been sent again");
        } else {
          await m.sendResetMail(user.email);
          (status = "ok"), (msg = "Password reset mail has been sent");
        }
      } else {
        (status = "nok"), (msg = "invalid user");
      }
    } else if (captchaExpired) {
      (status = "nok"),
        (msg = "captcha expired"),
        (details = "please enter the new captcha");
    } else if (!captchaOk) {
      (status = "nok"), (msg = "wrong captcha");
    }
  } else {
    status = "nok";
    msg = "Reset pw failed";
    details = `Didn't enter
              ${!req.body.user && req.body.captcha_value ? "user" : ""}
              ${req.body.user && !req.body.captcha_value ? "captcha" : ""}
              ${!req.body.user && !req.body.captcha_value ? "anything" : ""}
            `;
  }
  res.json({
    status,
    msg,
    details
  });
  await conn.done();
});
