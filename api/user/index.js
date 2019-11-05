//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
//USER ROUTES
{
  //profile get / patch
  include(r + "/profile");
  //login
  include(r + "/login");
  //register
  include(r + "/register");
  //resetpw
  include(r + "/resetpw");
}

//USER ACTIONS
{
  //logging into launcher via parameter
  include(r + "/action/launch");
  //pang
  include(r + "/action/ping");
  //discard
  include(r + "/action/link-discord");
  //stem
  include(r + "/action/link-steam");
  //undiscard
  include(r + "/action/unlink-discord");
  //unstem
  include(r + "/action/unlink-steam");
}
