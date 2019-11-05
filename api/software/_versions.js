//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//return route
_.app.get(r + '/:software', async (req, res) => {
  const conn = await $.get("userPool").getConnection();
  const whiteusers = await conn.query(
    `select steam from ${process.env.DB_USERS_TABL} where banned = 0 AND steam != 'NULL'`
  );
  let output;
  if (whiteusers) {
    for (const user of whiteusers) {
      output += `${user.steam}\n`;
    }
    res.send(output);
  }
});
