//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("./../!globals.js");
const m = require("./../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//get generic gamelist
_.app.get(r + "/games", async (req, res) => {
  res.send(await m.sendGames());
});
