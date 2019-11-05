//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////

//REGISTER
_.app.post(r + "/register", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  let status, msg, details;
  console.warn(
    `Somebody started a sign-up process with email '${req.body.email}'`
  );
  if (req.body.email && req.body.password && req.body.captcha_value) {
    const captchaOk =
      _.cache.get(req.body.captcha_chall) === req.body.captcha_value;
    const captchaExpired = _.cache.get(req.body.captcha_chall) === void 0;
    if (captchaOk) {
      const addr = req.body.email.toLowerCase();
      const passtest = _.owasp.test(req.body.password);
      //password strong enough
      if (passtest.strong) {
        if (await m.validateMail(addr)) {
          const mailExist =
            Object.values(
              (await conn.query(
                `select count(*) from ${process.env.DB_USERS_TABL} where email = '${addr}'`
              ))[0]
            )[0] !== 0;
          if (!mailExist) {
            //capitalize first char
            const capitalize = s => {
              if (typeof s !== "string") return "";
              return s.charAt(0).toUpperCase() + s.slice(1);
            };
            //make name off email
            const genName = n => {
              return `${capitalize(addr.split("@")[0].replace(/\W/g, ""))}${
                n ? n : ""
              }`;
            };
            let newuser = genName();
            while (
              Object.values(
                (await conn.query(
                  `select * from ${process.env.DB_USERS_TABL} where username LIKE '%${req.body.user}%' COLLATE utf8_general_ci`
                ))[0]
              )[0] !== 0
            )
              newuser = genName(Math.floor(Math.random() * 9) + 1);

            await conn.insert(process.env.DB_USERS_TABL, {
              email: addr,
              passhash: _.hash(req.body.password),
              token: _.hash(`${addr},${req.body.password}`),
              username: newuser
            });
            await m.sendRegMail(addr);
            (status = "ok"),
              (msg = "Please confirm the validation email and continue.");
          } else {
            console.warn(`Mail ${addr} already exists!`);
            (status = "nok"),
              (msg = "Mail exists"),
              (details = "A user has already registered with that adress.");
          }
        } else {
          (status = "nok"), (msg = "Invalid email");
        }
      } else {
        (status = "nok"),
          ((msg = "Invalid password"), (details = passtest.errors.join("\n")));
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
    msg = "Register failed";
    details = `Didn't enter
                      ${!req.body.email && req.body.password ? "email" : ""}
                      ${req.body.email && !req.body.password ? "password" : ""}
                      ${
                        req.body.email &&
                        req.body.password &&
                        !req.body.captcha_value
                          ? "captcha"
                          : ""
                      }
                      ${
                        !req.body.email &&
                        !req.body.password &&
                        req.body.captcha_value
                          ? "email & password"
                          : ""
                      }
                      ${
                        !req.body.email &&
                        !req.body.password &&
                        !req.body.captcha_value
                          ? "anything"
                          : ""
                      }
                    `;
  }
  res.json({
    status,
    msg,
    details
  });
  await conn.done();
});
