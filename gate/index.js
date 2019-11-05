//© 2019 by blubbll
("use strict");
const $ = require("node-global-storage");
const _ = require("../!globals.js");
const m = require("../!methods.js");
//////////////////////////////////////////////////////////////////////////////////////////
_.app.use(_.express.static("./gate/assets"));
//GATE ROUTES
{
  //activate gate page
  _.app.get("/gate/activate/:token", async (req, res) => {
    const conn = await $.get("userPool").getConnection();
    console.warn(
      `Somebody started a activation process with token '${req.params.token}'`
    );
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.params.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      const activated = user.activated[0] === 1;
      if (!activated) {
        user.activated = true;
        await conn.upsert(process.env.DB_USERS_TABL, user);
        res.redirect(`${process.env.API_HOST}/gate/welcome`);
      } else res.redirect(`${process.env.API_HOST}/gate/already-activated`);
    } else res.redirect(`${process.env.API_HOST}/gate/invalid-action`);
    await conn.done();
  });
  //change pw gatepage
  _.app.post("/gate/change-pw/:token", async (req, res) => {
    const conn = await $.get("userPool").getConnection();
    console.warn(
      `Somebody started a password change process with token '${req.params.token}'`
    );
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.params.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      const activated = user.activated[0] === 1;
      if (activated) {
        const passtest = _.owasp.test(req.body.password);
        if (passtest.strong) {
          user.passhash = _.hash(req.body.password);
          user.token = _.hash(`${user.email},${req.body.password}`);
          await conn.upsert(process.env.DB_USERS_TABL, user);
          await (m.resetFtp(user.id));
          res.redirect(`${process.env.API_HOST}/gate/change-pw-success`);
        } else {
          const details = passtest.errors.join("\n");
          const script = `<script>alert("Password problems: ${details}")</script>`;
          res.redirect(
            `${process.env.API_HOST}${req.url}?script=${Buffer.from(
              script
            ).toString("base64")}`
          );
        }
      } else
        res.json({
          status: "nok",
          msg: "user not activated yet"
        });
    } else res.redirect(`${process.env.API_HOST}/gate/invalid-action`);
    await conn.done();
  });
  //activate new gate page
  _.app.get("/gate/activate-new/:token/:newmail", async (req, res) => {
    const conn = await $.get("userPool").getConnection();
    console.warn(
      `Somebody started a activation process with token '${req.params.token}'`
    );
    const _user = await conn.query(
      `select * from ${process.env.DB_USERS_TABL} where token = '${req.params.token}'`
    );
    if (_user.length) {
      const user = _user[0];
      const activated = user.activated[0] === 1;
      if (activated) {
        const newmail = _.cryptr.decrypt(req.params.newmail);
        //update data
        user.email = newmail;
        user.token = _.hash(`${user.newmail},${user.passhash}`);
        await conn.upsert(process.env.DB_USERS_TABL, user);
        res.redirect(`${process.env.API_HOST}/gate/change-email-success`);
      } else res.redirect(`${process.env.API_HOST}/gate/invalid-action`);
    } else res.redirect(`${process.env.API_HOST}/gate/invalid-action`);
    await conn.done();
  });
  //generic gate page
  _.app.get("/gate/:file", async (req, res, next) => {
    const file = `${global.__basedir}/views/gate/${req.params.file}.html`;
    if (_.fs.existsSync(file))
      req.query.script
        ? res.send(
            _.fs
              .readFileSync(file)
              .toString()
              .replace(
                "{{script}}",
                Buffer.from(req.query.script, "base64").toString("utf8")
              )
          )
        : res.sendFile(file);
    else next();
  });
  //secur page for gate
  _.app.get("/gate/:file/:token", async (req, res, next) => {
    const conn = await $.get("userPool").getConnection();
    const file = `${global.__basedir}/views/gate/${req.params.file}.html`;
    if (_.fs.existsSync(file)) {
      const _user = await conn.query(
        `select * from ${process.env.DB_USERS_TABL} where token = '${req.params.token}'`
      );
      if (_user.length) {
        const user = _user[0];
        const activated = user.activated[0] === 1;
        if (activated) {
          req.query.script
            ? res.send(
                _.fs
                  .readFileSync(file)
                  .toString()
                  .replace(
                    "{{script}}",
                    Buffer.from(req.query.script, "base64").toString("utf8")
                  )
              )
            : res.sendFile(file);
        } else {
          res.redirect(`${process.env.API_HOST}/gate/inactive-account`);
        }
      } else res.redirect(`${process.env.API_HOST}/gate/invalid-action`);
    } else next();
    await conn.done();
  });
}
