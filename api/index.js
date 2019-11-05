//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("./../!globals.js");
const m = require("./../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
{
  //games route
  include(r + "/games");
  //captcha
  include(r + "/naptcha");
  //ftp details
  include(r + "/ftp");
  //user actions
  include(r + "/user/*");

  //GAMES
  include(r + "/games/*");

  //SOFTWARE
  include(r + "/software/*");
}
