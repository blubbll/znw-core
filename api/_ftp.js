//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("./../!globals.js");
const m = require("./../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//ftp data
_.app.get(r + "/ftp", async (req, res) => {
  let conn = await $.get("userPool").getConnection();
  let status, msg, data, details;
  console.warn(
    `Somebody started a ftp info process with token '${req.query.token}'`
  );
  let _user = await conn.query(
    `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
  );
  //user exist
  if (_user.length) {
    const user = _user[0];
    const activated = user.activated[0] === 1;
    if (activated) {
      const banned = user.banned[0] === 1;
      if (!banned) {
        const conn2 = await $.get("userftpPool").getConnection();
        const dbdata = await conn2.getById(
          process.env.DB_USERFTPS_TABL,
          user.id
        );
        if (dbdata) {
          (status = "ok"),
            (msg = "getting FTP info successful"),
            (data = {
              user: dbdata.ftp_user,
              pass: dbdata.ftp_pass
            });
        } else {
          const newdata = await m.createFtp(user.id);
          if (newdata) {
            await conn2.insert(process.env.DB_USERFTPS_TABL, {
              id: user.id,
              ftp_user: newdata.user,
              ftp_pass: newdata.pass
            });
            (status = "ok"),
              (msg = "getting FTP info successful (account was created)"),
              (data = {
                user: newdata.user,
                pass: newdata.pass
              });
          } else {
            (status = "nok"), (msg = "unknown error at ftp account creation");
          }
        }
        await conn2.done();
      } else {
        (status = "nok"),
          (msg = "you are banned"),
          (details = "contact us on discord if you think this is in error.");
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

  //output
  res.json({
    status,
    msg,
    data,
    details
  });
  await conn.done();
});
