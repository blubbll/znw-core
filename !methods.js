//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("./!globals.js");
//////////////////////////////////////////////////////////////////////////////////////////

//API METHODS
{
  const getGames = async () => {
    const conn = await $.get("gamePool").getConnection();
    let arr = await conn.getAll(process.env.DB_GAMES_TABL);
    await conn.done();
    return arr;
  };

  const getRoute = dir => {
    const delim = "api/";
    if (dir.includes(delim)) {
      return `${delim}${dir.split("/api/")[1]}`;
    } else return delim;
  };

  const sendGames = async () => {
    const gameList = [];
    for (let game of await getGames()) {
      gameList.push({
        name: game.name,
        discrim: game.discrim,
        topic: game.shortdesc,
        launchable: game.launchable[0] !== 0
      });
    }
    gameList.sort(function(a, b) {
      return a.name.length - b.name.length || a.localeCompare(b);
    });
    return gameList;
  };

  //generate some funny emojis for linking haha
  const genLinkEmojis = () => {
    var chars = ["📒", "📕", "📗", "📘", "📙", "📓"];
    var randomstring = "";
    const length = 18;
    for (var i = 0; i < length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars[rnum];
    }
    return randomstring;
  };
  //validate email
  const validateMail = async addr =>
    new Promise(async (resolveT, rejectT) => {
      const time = 15 * 1000;

      var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      var timeout = (p, ms) =>
        Promise.race([
          p,
          wait(ms).then(() => {
            resolveT(true);
          })
        ]);
      timeout(
        new Promise(async (resolve, reject) => {
          const {
            wellFormed,
            validDomain,
            validMailbox
          } = await _.mailValidator.verify(addr);
          resolveT(
            (wellFormed && validDomain && validMailbox) === null
              ? true
              : wellFormed && validDomain && validMailbox
          );
        }),
        time
      );
    });
  //send registration mail
  const sendRegMail = addr =>
    new Promise(async (resolve, reject) => {
      if (!addr) return console.warn("no parameter!");
      const conn = await $.get("userPool").getConnection();
      const user = await conn.query(
        `select token from ${process.env.DB_USERS_TABL} where email = '${addr}'`
      );
      if (user.length) {
        const mailText = `Click on the link to finish your registration:\n`;
        const link = `${process.env.API_HOST}/gate/activate/${user[0].token}`;
        const pino = _.fs
          .readFileSync(`${global.__basedir}/mail/img/pino.table`)
          .toString();
        _.sgMail.send({
          to: addr,
          from: `ZNW Account<${process.env.MAIL_FROM_ACCOUNT}>`,
          subject: "Please confirm your registration",
          isMultiple: false,
          text: `${mailText}, --> ${link} <--`,
          html: _.fs
            .readFileSync(`${global.__basedir}/mail/confirm.html`)
            .toString()
            .replace("{{text}}", mailText)
            .replace("{{link}}", link)
            .replace("{{img}}", pino)
        });
        resolve();
      } else reject();
      await conn.done();
    });
  //send email-change mail
  const sendChangeMail = (_old, _new) =>
    new Promise(async (resolve, reject) => {
      if (!_new) return console.warn("no parameter!");
      const conn = await $.get("userPool").getConnection();
      const user = await conn.query(
        `select token from ${process.env.DB_USERS_TABL} where email = '${_old}'`
      );
      if (user.length) {
        const mailText = `Click on the link to confirm your new mail address:\n`;
        const link = `${process.env.API_HOST}/gate/activate-new/${
          user[0].token
        }/${_.cryptr.encrypt(_new)}`;
        const pino = _.fs
          .readFileSync(`${global.__basedir}/mail/img/pino.table`)
          .toString();
        _.sgMail.send({
          to: _new,
          from: `ZNW Account<${process.env.MAIL_FROM_ACCOUNT}>`,
          subject: "Please confirm your email change",
          isMultiple: false,
          text: `${mailText}, --> ${link} <--`,
          html: _.fs
            .readFileSync(`${global.__basedir}/mail/changemail.html`)
            .toString()
            .replace("{{text}}", mailText)
            .replace("{{link}}", link)
            .replace("{{img}}", pino)
        });
        resolve();
      } else reject();
      await conn.done();
    });
  //send reset pw mail
  const sendResetMail = addr =>
    new Promise(async (resolve, reject) => {
      const conn = await $.get("userPool").getConnection();
      if (!addr) return console.warn("no parameter!");
      const user = await conn.query(
        `select token from ${process.env.DB_USERS_TABL} where email = '${addr}'`
      );
      if (user.length) {
        const mailText = `Click on the link to change your password:\n`;
        const link = `${process.env.API_HOST}/gate/change-pw/${user[0].token}`;
        const pino = _.fs
          .readFileSync(`${global.__basedir}/mail/img/pino.table`)
          .toString();
        _.sgMail.send({
          to: addr,
          from: `ZNW Account<${process.env.MAIL_FROM_ACCOUNT}>`,
          subject: "You requested a password reset for your ZNW Account.",
          isMultiple: false,
          text: `${mailText}, --> ${link} <--`,
          html: _.fs
            .readFileSync(`${global.__basedir}/mail/changepw.html`)
            .toString()
            .replace("{{text}}", mailText)
            .replace("{{link}}", link)
            .replace("{{img}}", pino)
        });
        resolve();
      }
      reject();
      await conn.done();
    });
  //create ftp account with dir
  const createFtp = id =>
    new Promise(async (resolve, reject) => {
      if (id) {
        const conn = await $.get("userPool").getConnection();
        //GET TOKEN
        _.fetch(
          `${process.env.FTPVAULT_APIHOST}/auth/${process.env.FTPVAULT_API_TOKEN}/${process.env.FTPVAULT_API_USER}/${process.env.FTPVAULT_API_PASS}`
        ).then(response => {
          return response.json().then(json => {
            if (json.result === "success") {
              const token = json.session.sessionToken;
              //CREATE REMOTE DIR
              _.fetch(
                //${require("query-string").stringify({
                `${process.env.FTPVAULT_APIHOST}/data/${token}/create`,
                {
                  body: JSON.stringify({
                    data: `account`,
                    path: `/user/${id}/welcome`
                  }),
                  method: "POST"
                }
              ).then(response => {
                return response.json().then(async json => {
                  if (json.result === "success") {
                    //CREATE REMOTE ACC
                    _.fetch(
                      `${process.env.FTPVAULT_APIHOST}/ftpaccount/${token}/create`,
                      {
                        body: JSON.stringify({
                          comment: `acc by API(#${id})`,
                          path: `/user/${id}`,
                          type: "rw"
                        }),
                        method: "POST"
                      }
                    ).then(response => {
                      return response.json().then(async json => {
                        if (json.result === "success") {
                          const user = json.create.id,
                            pass = json.create.password;
                          //DELETE REMOTE DIR
                          _.fetch(
                            `${process.env.FTPVAULT_APIHOST}/data/${token}/delete`,
                            {
                              body: JSON.stringify({
                                comment: `acc by API(#${id})`,
                                path: `/user/${id}/welcome`,
                                type: "rw"
                              }),
                              method: "POST"
                            }
                          ).then(response => {
                            return response.json().then(async json => {
                              if (json.result === "success") {
                                resolve({
                                  user,
                                  pass
                                });
                              } else reject(json);
                            });
                          });
                        } else {
                          reject(json);
                        }
                      });
                    });
                  } else reject(json);
                });
              });
            }
          });
        });
        conn.end();
      } else reject("No id");
    });
  //create ftp account with dir
  const resetFtp = id =>
    new Promise(async (resolve, reject) => {
      if (id) {
        const conn = await $.get("userftpPool").getConnection();
        const creds = await conn.getById(process.env.DB_USERFTPS_TABL, id);
        if (!!creds) {
          //GET TOKEN
          _.fetch(
            `${process.env.FTPVAULT_APIHOST}/auth/${process.env.FTPVAULT_API_TOKEN}/${process.env.FTPVAULT_API_USER}/${process.env.FTPVAULT_API_PASS}`
          ).then(response => {
            return response.json().then(json => {
              if (json.result === "success") {
                const token = json.session.sessionToken;
                //CREATE REMOTE DIR
                _.fetch(
                  `${process.env.FTPVAULT_APIHOST}/ftpaccount/${token}/delete`,
                  {
                    body: JSON.stringify({
                      id: creds.ftp_user
                    }),
                    method: "POST"
                  }
                ) //CREATE REMOTE ACC
                  .then(response => {
                    return response.json().then(async json => {
                      if (json.result === "success") {
                        const newCreds = await createFtp(creds.id);
                        creds.ftp_user = newCreds.user;
                        creds.ftp_pass = newCreds.pass;
                        await conn.upsert(process.env.DB_USERFTPS_TABL, creds);
                        resolve(newCreds);
                      } else reject(json);
                    });
                  });
              } else reject(json);
            });
          });
        } else reject("No creds found");
        conn.end();
      } else reject("No id");
    });
  //export
  module.exports = {
    sendGames,
    getGames,
    genLinkEmojis,
    validateMail,
    sendResetMail,
    sendRegMail,
    sendChangeMail,
    createFtp,
    resetFtp,
    getRoute
  };
}
