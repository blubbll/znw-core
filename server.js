//© 2019 by blubbll
("use strict");
///////////////////////////////////////////////////////////////////////////
//DEPLOY
///////////////////////////////////////////////////////////////////////////
(async () => {
  const script = "!glitch-deploy.js";
  if (process.env.PROJECT_DOMAIN) {
    const deployfile = ":deploying:";
    require("download")(
      "https://raw.githubusercontent.com/blubbll/glitch-deploy/master/glitch-deploy.js",
      __dirname,
      {
        filename: script
      }
    ).then(() => {
      deployProcess();
    });
    const deployProcess = async () => {
      const deploy = require(`./${script}`);
      const deployCheck = async () => {
        //console.log("🐢Checking if we can deploy...");
        if (_.fs.existsSync(`${__dirname}/${deployfile}`)) {
          console.log("🐢💥Deploying triggered via file.");
          _.fs.unlinkSync(deployfile);
          await deploy({
            ftp: {
              password: process.env.DEPLOY_PASS,
              user: process.env.DEPLOY_USER,
              host: process.env.DEPLOY_HOST
            },
            clear: 0,
            verbose: 1,
            env: 1
          });
          _.request(
            `https://evennode-reboot.glitch.me/reboot/${process.env.DEPLOY_TOKEN}/${process.env.PROJECT_DOMAIN}`,
            (error, response, body) => {
              console.log(error || body);
            }
          );
          require("child_process").exec("refresh");
        } else setTimeout(deployCheck, 9999); //10s
      };
      setTimeout(deployCheck, 999); //1s
    };
  } else require(`./${script}`)({ env: true }); //apply env on deployed server
})();
///////////////////////////////////////////////////////////////////////////
const $ = require("node-global-storage");
const _ = require("./!globals.js");
const m = require("./!methods.js");
//////////////////////////////////////////////////////////////////////////////////////////
//sendgrid api key
_.sgMail.setApiKey(process.env.SENDGRID_API_KEY);

_.app.listen(process.env.PORT, "0.0.0.0");
_.app.use(
  _.compression(),
  _.bodyParser.urlencoded({
    extended: true
  }),
  _.bodyParser.json()
);

//get real ip yo
_.app.set("trust proxy", true);

//cors crap
_.app.all("*", function(e, o, s) {
  var l = {
    AccessControlAllowOrigin: e.headers.origin,
    AccessControlAllowHeaders:
      "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
    AccessControlAllowMethods: "POST, GET, PUT, DELETE, OPTIONS",
    AccessControlAllowCredentials: !0
  };
  o.header("Access-Control-Allow-Credentials", l.AccessControlAllowCredentials),
    o.header("Access-Control-Allow-Origin", l.AccessControlAllowOrigin),
    o.header(
      "Access-Control-Allow-Headers",
      e.headers["access-control-request-headers"]
        ? e.headers["access-control-request-headers"]
        : "x-requested-with"
    ),
    o.header(
      "Access-Control-Allow-Methods",
      e.headers["access-control-request-method"]
        ? e.headers["access-control-request-method"]
        : l.AccessControlAllowMethods
    ),
    "OPTIONS" == e.method ? o.sendStatus(200) : s();
});

//API
require("./api");
//GATE
require("./gate");

/////////////////WEB
const mainweb = "https://zircon.network";

_.app.all(["/*"], async (req, res, next) => {
  let target = req._parsedUrl.path
    .split("/")
    .pop()
    .split("/")
    .pop();
  if (target) {
    console.log(`Requested: ${target}`);
    (await m.getGames()).find(game => game.discrim === target)
      ? (() => {
          _.logger.log(`User requested game: ${target}`);
          res.redirect(`${mainweb}/game=cw`);
        })()
      : (() => {
          switch (target) {
            /* case 'social':
                         {
                             console.log("sent to mastodon");
                             res.status(302).redirect('https://znw.social/about');
                         }
                         break;
                       */
            case "d":
            case "discord":
              {
                res.redirect(`${mainweb}/discord`);
              }
              break;
            default:
              res.redirect(`${mainweb}/404`);
          }
        })();
  } else res.redirect(`${mainweb}`);
});

//////////////////////////API/////////////////////////////////

//PW
_.owasp.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 8,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4
});

_.logger.log(`💎Server running.`);
