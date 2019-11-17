//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////

//all info
_.app.get(r + "/:sw", async (req, res) => {
  let status, msg, details, data;

  const swConn = await $.get("swPool").getConnection();
  //get sw
  const sw = await swConn.query(
    `select * from ${process.env.DB_SW_TABL} where ident = '${req.params.sw}'`
  );
  if (sw.length) {
    (status = "ok"), (msg = "sending sw data"), (data = sw);
  } else {
    (status = "nok"), (msg = `could not find software "${req.params.sw}"`);
  }
  swConn.done();

  res.json({ status, msg, data, details });
});
//all info (game)
_.app.get(r + "/game/:discrim", async (req, res) => {
  let status, msg, details, data;
  const gameConn = await $.get("gamePool").getConnection();
  const swId = (await gameConn.query(
    `select software from ${process.env.DB_GAMES_TABL} where discrim = '${req.params.discrim}'`
  ))[0].software;
  //sw exist
  if (swId) {
    const swConn = await $.get("swPool").getConnection();
    const sw = await swConn.getById(process.env.DB_SW_TABL, swId);
    if (sw) {
      (status = "ok"), (msg = "sending sw data"), (data = sw);
    } else {
      (status = "nok"), (msg = "error at getting sw  details for sw#" + sw);
    }
    swConn.done();
  } else {
    (status = "nok"), (msg = "no game software found with that discrim");
  }
  gameConn.done();
  res.json({ status, msg, data, details });
});
