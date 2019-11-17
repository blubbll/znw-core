//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../../!globals.js");
const m = require("../../!methods.js");
const include = _.include;
/////////////////////////////////////////////////////////////////////////////////////////
const r = m.getRoute(__dirname);
/////////////////////////////////////////////////////////////////////////////////////////
{
  //info
  include(r + "/info");
  
  //versions
  include(r + "/version");
}