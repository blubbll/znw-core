//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//get own profile
_.app.get(r + "/profile", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  console.warn(
    `Somebody requested their user data with token '${req.query.token}'`
  );
  const _user = await conn.query(
    `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
  );
  if (_user.length) {
    const user = _user[0];
    let _discord, _steam;
    let out = () =>
      res.json({
        status: "ok",
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          discord: _discord,
          steam: _steam,
          joined: +new Date(user.joined)
        }
      });
    //user has discord or steam (todo: user async requests in the future, idk)
    if (user.discord || user.steam) {
      //discord only
      if (user.discord && !user.steam)
        _.request(
          `${process.env.DISCORD_HOST}/api/user/lookup/${process.env.PINO_TOKEN}/${user.discord}`,
          (error, response, body) => {
            let json = JSON.parse(body);
            if (!error && json.status === "ok") {
              _discord = json.data;
              out();
            } else res.json("nok");
          }
        );
      //steam only
      if (user.steam && !user.discord)
        _.request(
          `${process.env.STEAM_HOST}/api/user/lookup/${process.env.PINO_TOKEN}/${user.steam}`,
          (error, response, body) => {
            let json = JSON.parse(body);
            if (!error && json.status === "ok") {
              _discord = json.data;
              out();
            } else res.json("nok");
          }
        );
      //both steam AND discord
      if (user.steam && user.discord)
        _.request(
          `${process.env.DISCORD_HOST}/api/user/lookup/${process.env.PINO_TOKEN}/${user.discord}`,
          (error, response, body) => {
            let json = JSON.parse(body);
            if (!error && json.status === "ok") {
              _discord = json.data;
              _.request(
                `${process.env.STEAM_HOST}/api/user/lookup/${process.env.PINO_TOKEN}/${user.steam}`,
                (error, response, body) => {
                  let json = JSON.parse(body);
                  if (!error && json.status === "ok") {
                    _steam = json.data;
                    out();
                  } else res.json("nok");
                }
              );
            } else res.json("nok");
          }
        );
    } else out();
  } else
    res.json({
      status: "nok",
      msg: "invalid user"
    });
  await conn.done();
});

//update own profile
_.app.post(r + "/profile", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  let status, msg, details;
  console.warn(
    `Somebody requested a user data patch with token '${req.query.token}'`
  );
  if (req.body.username || req.body.email || req.body.password) {
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      //username change
      if (req.body.username && req.body.username !== user.username) {
        if (/^\w+$/.test(req.body.username)) {
          if (
            !(await conn.query(
              `select * from ${process.env.DB_USERS_TABL} where username LIKE '%${req.body.user}%' COLLATE utf8_general_ci`
            )).length
          ) {
            user.username = req.body.username;
            await conn.upsert(process.env.DB_USERS_TABL, user);
            (status = "ok"), (msg = "username updated");
          } else {
            (status = "nok"), (msg += "user with that username exists already");
          }
        } else (status = "nok"), (msg = "Invalid username");
      }
      //email change
      if (req.body.email && req.body.email !== user.email) {
        if (await m.validateMail(req.body.email)) {
          if (
            !(await conn.query(
              `select * from ${process.env.DB_USERS_TABL} where email = '${req.body.email}'`
            )).length
          ) {
            await m.sendChangeMail(user.email, req.body.email);
            user.activated = false;
            await conn.upsert(process.env.DB_USERS_TABL, user);
            (status = "ok"), (msg = "mail updated, please confirm the email.");
          } else {
            (status = "nok"), (msg = "user with that email exists already");
          }
        } else {
          (status = "nok"), (msg = "invalid email");
        }
      }
      //pw change
      if (req.body.password && _.hash(req.body.password) !== user.passhash) {
        const passtest = _.owasp.test(req.body.password);
        //password strong enough
        if (passtest.strong) {
          if (
            !(await conn.query(
              `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
            ).length)
          ) {
            user.passhash = _.hash(req.body.password);

            await conn.upsert(process.env.DB_USERS_TABL, user);

            //patch ftp
            await m.resetFtp(user.id);

            (status = "ok"), (msg = "password updated");
          } else {
            (status = "nok"), (msg = "wrong token");
          }
        } else {
          (status = "nok"),
            ((msg = "Invalid password"),
            (details = passtest.errors.join("\n")));
        }
      }
    } else {
      (status = "nok"), (msg = "invalid user");
    }
  } else {
    status = "nok";
    msg = "Update failed";
    details = `Didn't enter
                      ${!req.body.email && !req.body.username ? "anything" : ""}
                   `;
  }
  res.json({
    status,
    msg,
    details
  });
  await conn.done();
});
