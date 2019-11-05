//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../../!globals.js");
const m = require("../../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////

//LOGGING INTO LAUNCHER WITH TOKEN
_.app.post(r + "/launch", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  let status, msg, details;
  console.warn(
    `Somebody started a launch process with token '${req.body.token}'`
  );
  if (req.body.token) {
    let _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.body.token}'`
    );
    //user exist
    if (_user.length) {
      const user = _user[0];
      const banned = user.banned[0] === 1;
      if (!banned) {
        const activated = user.activated[0] === 1;
        if (activated) {
          (status = "ok"), (msg = "Launch request successful");
        } else {
          await m.sendRegMail(user.email);
          (status = "nok"),
            (msg = "You didn't verify your account yet."),
            (details = "We re-sent the confirmation email to your adress.");
        }
      } else {
        (status = "nok"),
          (msg = "you are banned"),
          (details = "contact us on discord if you think this is in error.");
      }
    } else {
      (status = "nok"), (msg = "Invalid token");
    }
  } else {
    (status = "nok"), (msg = "missing token");
  }
  //send response to client
  res.json({
    status,
    msg,
    details
  });
  await conn.done();
});
