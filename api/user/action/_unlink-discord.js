//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../../!globals.js");
const m = require("../../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//unlink discord
_.app.get(r + "/unlink-discord", async (req, res) => {
  let conn = await $.get("userPool").getConnection();
  console.warn(`Somebody requested a discord-link with '${req.query.token}'`);

  if (req.query.token) {
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      _.request(
        `${process.env.DISCORD_HOST}/api/user/unlink/${process.env.PINO_TOKEN}/${user.discord}`,
        async (error, response, body) => {
          let json = JSON.parse(body);
          if (!error && json.status === "ok") {
            user.discord = void 0;

            res.json({
              status: "ok",
              msg: "Your Discord has been unlinked."
            });
          } else
            res.json({ status: "nok", msg: "Error at unlinking your Discord" });

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
