//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//LOGIN
_.app.post(r + "/login", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  let status, msg, details;
  console.warn(`Somebody started a login process for user '${req.body.user}'`);
  if (req.body.user && req.body.password && req.body.captcha_value) {
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
        if (activated) {
          const banned = user.banned[0] === 1;
          if (!banned) {
            if (user.passhash === _.hash(req.body.password)) {
              (status = "ok"),
                (msg = "Login successful"),
                res.setHeader("Content-Language", user.token);
            } else {
              (status = "nok"), (msg = "wrong password");
            }
          } else {
            (status = "nok"),
              (msg = "you are banned"),
              (details =
                "contact us on discord if you think this is in error.");
          }
        } else {
          await m.sendRegMail(user.email);
          (status = "nok"),
            (msg = "You didn't verify your account yet."),
            (details = "We re-sent the confirmation email to your adress.");
        }
      } else {
        (status = "nok"), (msg = "Invalid user");
      }
    } else if (captchaExpired) {
      (status = "nok"),
        (msg = "captcha expired"),
        (details = "please enter the new captcha");
    } else if (!captchaOk) {
      (status = "nok"), (msg = "wrong captcha");
    }
  } else {
    (status = "nok"),
      (msg = "Login failed"),
      (details = `Didn't enter
                          ${!req.body.user && req.body.password ? "user" : ""}
                          ${
                            req.body.user && !req.body.password
                              ? "password"
                              : ""
                          }
                          ${
                            req.body.user &&
                            req.body.password &&
                            !req.body.captcha_value
                              ? "captcha"
                              : ""
                          }
                          ${
                            !req.body.user &&
                            !req.body.password &&
                            req.body.captcha_value
                              ? "user & password"
                              : ""
                          }
                          ${
                            !req.body.user &&
                            !req.body.password &&
                            !req.body.captcha_value
                              ? "anything"
                              : ""
                          }
                        `);
  }
  res.json({
    status,
    msg,
    details
  });
  await conn.done();
});
