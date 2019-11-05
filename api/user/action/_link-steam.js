//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../../!globals.js");
const m = require("../../../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const route = `/api/${__dirname.split("/api/")[1]}`;
/////////////////////////////////////////////////////////////////////////////////////////
//link steam
//link discord
_.app.get(route + "/link-steam", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  console.warn(`Somebody requested a steam-link with '${req.query.token}'`);

  if (req.query.token) {
    const _users = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.query.token}'`
    );

    if (_users.length) {
      const user = _users[0];
      if (user.banned[0] !== 1) {
        //generate an in-memory key for the link code. needs to be verificable over an api for pino bot.
        let key = m.genLinkEmojis();

        //no active dupe keys
        while (_.cache.get(key)) key = m.genLinkEmojis();

        _.cache.set(key, user.id);
        res.json({
          status: "ok",
          data: `linkme:${key}`
        });
      } else {
        res.json({
          status: "nok",
          msg: `user is banned`
        });
      }
    } else
      res.json({
        status: "nok",
        msg: "invalid key",
        details: "probably expired"
      });
  } else
    res.json({
      status: "nok",
      msg: "no key"
    });
  await conn.done();
});

//key resolving for external bots etc. todo idea: might add a second token to restrict access
_.app.get(route + "/link-resolve-steam/:key", async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  console.warn(
    `Somebody requested a steam-link resolve with '${req.params.key}'`
  );
  //does request contain a key
  if (req.params.key) {
    const userByKey = _.cache.get(decodeURIComponent(req.params.key));

    //find user in by by id
    const user = await conn.getById(process.env.DB_USERS_TABL, userByKey);

    //user found
    if (user) {
      //user found, return user
      res.json({
        status: "ok",
        msg: "Here's your user:",
        data: user.id
      });
    } else
      res.json({
        status: "nok",
        msg: "invalid key",
        details: "probably expired"
      });
  } else
    res.json({
      status: "nok",
      msg: "no key"
    });
  await conn.done();
});
