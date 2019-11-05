//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("./../!globals.js");
const m = require("./../!methods.js");
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//GETTING CAPTCHA
_.app.get(r + "/naptcha", (req, res) => {
  var nap = _.naptcha.perform();
  var napkey = _.hash(`nap_${+new Date()}`);
  _.cache.set(napkey, nap.text);
  res.json({
    status: "ok",
    challenge: napkey,
    img: new Buffer(nap.bytes).toString("base64")
  });
  _.logger.log(`${req.ip} requested a new captcha ${nap.text}`);
});
