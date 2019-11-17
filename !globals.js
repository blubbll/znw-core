//© Blubbll 2019
("use strict");
const $ = require("node-global-storage");

const include = script => {
  script = script.endsWith("/*")
    ? (script = `./${script.replace("/*", "/index.js")}`)
    : `./${script}.js`.replace(
        script.match(/[^\/]+$/)[0],
        `_${script.match(/[^\/]+$/)[0]}`
      );
  if (script.endsWith("_*.js")) script = script.replace("_*.js", "index.js");
  require(script);
  delete require.cache[script];
  script.includes("//") || script.endsWith("/index.js")
    ? console.log(
        `📜loaded server module group '${script
          .replace("//", "/")
          .replace("/index.js", "")
          .replace(".js", "")
          .replace("_", "")}'❕`
      )
    : console.log(
        `📜loaded server module '${script
          .replace(".js", "")
          .replace("_", "")}'❕`
      );
};

const execute = script => {
  script = script.endsWith("/*")
    ? (script = `./${script.replace("/*", "/index.js")}`)
    : `./${script}.js`.replace(
        script.match(/[^\/]+$/)[0],
        `_${script.match(/[^\/]+$/)[0]}`
      );
  if (script.endsWith("_*.js")) script = script.replace("_*.js", "index.js");
  require(script)();
  console.log(`📜executed module '${script}'❕`);
};

if (!global.__basedir) global.__basedir = __dirname;

module.exports = {
  express: require("express"),
  proxy: require("http-proxy-middleware"),
  compression: require("compression"),
  request: require("request"),
  wait: require("util").promisify(setTimeout),
  _logger: require("pino")({
    prettyPrint: {
      colorize: true
    }
  }),
  Bunny: require("bunnycdn-node"),
  fs: require("fs"),
  moment: require("moment"),
  hash: require("sha256"),
  naptcha: require("naptcha").of(),
  cache: require("safe-memory-cache/map")({
    maxTTL: 1000 * 60 * 2
  }),
  fetch: require("node-fetch"),
  mySqlEasier: require("mysql-easier"),
  bodyParser: require("body-parser"),
  mailValidator: new (require("email-deep-validator"))(),
  sgMail: require("@sendgrid/mail"),
  Cryptr: require("cryptr"),
  owasp: require("owasp-password-strength-test"),
  include,
  execute
};
const _ = module.exports;
_.app = $.set("app", _.express());
///////////////////////////////////////////////
const crypkey = +new Date();
_.cryptr = new _.Cryptr(`${crypkey}`);
module.exports.logger = {
  log: s =>
    _._logger.info(
      `\n${_.moment()
        .add(2, "hour")
        .format("HH:mm:ss")}> ${s}\n${"^".repeat(64)}`
    ),
  success: s =>
    _._logger.info(
      `\n✔️${" ".repeat(2)}${_.moment()
        .add(2, "hour")
        .format("HH:mm:ss")}> ${s}\n${"^".repeat(64)}`
    ),
  error: s =>
    _._logger.error(
      `\n❌${" ".repeat(2)}${_.moment()
        .add(2, "hour")
        .format("HH:mm:ss")}> ${s}\n${"^".repeat(64)}`
    )
};

//GameDB
const gamePool = $.set(
    "gamePool",
    _.mySqlEasier.createPool({
      host: process.env.DB_GAMES_HOST,
      user: process.env.DB_GAMES_USER,
      password: process.env.DB_GAMES_PASS,
      database: process.env.DB_GAMES_NAME
    })
  ),
  getGames = () =>
    new Promise(async (resolve, reject) => {
      let dbgames;
      const conn = await gamePool.getConnection();
      conn.getAll(process.env.DB_GAMES_TABL).then(games => {
        dbgames = games;
        dbgames.sort(function(a, b) {
          return a.name.length - b.name.length || a.localeCompare(b);
        });
        console.log("got games.");
        return resolve(dbgames);
      });
      conn.done();
    });

//SoftwareDB
const swPool = $.set(
    "swPool",
    _.mySqlEasier.createPool({
      host: process.env.DB_SW_HOST,
      user: process.env.DB_SW_USER,
      password: process.env.DB_SW_PASS,
      database: process.env.DB_SW_NAME
    })
  ),
  getSoftware = () =>
    new Promise(async (resolve, reject) => {
      let dbgames;
      const conn = await gamePool.getConnection();
      conn.getAll(process.env.DB_SW_TABL).then(games => {
        dbgames = games;
        dbgames.sort(function(a, b) {
          return a.name.length - b.name.length || a.localeCompare(b);
        });
        console.log("got games.");
        return resolve(dbgames);
      });
      conn.done();
    });

//userFtpDB
const userftpPool = $.set(
    "userftpPool",
    _.mySqlEasier.createPool({
      host: process.env.DB_USERFTPS_HOST,
      user: process.env.DB_USERFTPS_USER,
      password: process.env.DB_USERFTPS_PASS,
      database: process.env.DB_USERFTPS_NAME
    })
  ),
  getUserFtps = () =>
    new Promise(async (resolve, reject) => {
      let dbuserftps;
      const conn = await gamePool.getConnection();
      conn.getAll(process.env.DB_GAMES_TABL).then(ftps => {
        dbuserftps = ftps;
        dbuserftps.sort(function(a, b) {
          return a.name.length - b.name.length || a.localeCompare(b);
        });
        console.log("got userftps.");
        return resolve(dbuserftps);
      });
      conn.done();
    });

//userDB
const userPool = $.set(
    "userPool",
    _.mySqlEasier.createPool({
      host: process.env.DB_USERS_HOST,
      user: process.env.DB_USERS_USER,
      password: process.env.DB_USERS_PASS,
      database: process.env.DB_USERS_NAME
    })
  ),
  getUsers = async () =>
    new Promise(async (resolve, reject) => {
      let dbusers;
      const conn = await gamePool.getConnection();
      conn.getAll("users").then(users => {
        dbusers = users;
        dbusers.sort(function(a, b) {
          return a.name.length - b.name.length || a.localeCompare(b);
        });
        console.log("got users.");
        return resolve(dbusers);
      });
      conn.done();
    });
