//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../../!globals.js");
const m = require("../../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//pung
_.app.post(r + "/ping", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  //console.warn(`Somebody pinged the website with '${req.body.token}'`);

  if (req.body.token) {
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.body.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      user.lastonline = new Date();
      await conn.upsert(process.env.DB_USERS_TABL, user);
      res.json({
        status: "ok"
      });
    } else
      res.json({
        status: "nok",
        msg: "invalid token",
        details: "expired"
      });
  } else
    res.json({
      status: "nok",
      msg: "no token"
    });
  await conn.done();
});
