//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../../!globals.js");
const m = require("../../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//unlink steam
_.app.get(r + "/unlink-steam", async (req, res) => {
  let conn = await $.get("userPool").getConnection();
  console.warn(`Somebody requested a discord-link with '${req.query.token}'`);

  if (req.query.token) {
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      _.request(
        `${process.env.STEAM_HOST}/api/user/unlink/${process.env.PINO_TOKEN}/${user.steam}`,
        async (error, response, body) => {
          let json = JSON.parse(body);
          if (!error && json.status === "ok") {
            user.steam = void 0;
            res.json({
              status: "ok",
              msg: "Your Steam has been unlinked."
            });
          } else
            res.json({ status: "nok", msg: "Error at unlinking your Steam" });

          conn = await $.get("userPool").getConnection();
          await conn.upsert(process.env.DB_USERS_TABL, user);
        }
      );
    } else
      res.json({
        status: "nok",
        msg: "invalid user"
      });
  } else
    res.json({
      status: "nok",
      msg: "no key"
    });
  await conn.done();
});
