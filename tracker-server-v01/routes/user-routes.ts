import * as express from "express";
import { pool } from "../config/db";
import { User } from "../model/user";

export const userRouter = express.Router();

userRouter.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  const sql = `
    SELECT * FROM user
    WHERE username = ${pool.escape(username)}
      AND password = SHA1(${pool.escape(password)})
  `;
  pool.query(sql, (err, rows) => {
    if (err) return next(err);
    if (rows.length > 0) {
      const row = rows[0];
      const user = new User(
        row.uuid,
        row.username,
        row.email,
        "",
        row.is_admin,
        row.firstname,
        row.lastname,
        row.sex,
        row.address,
        row.postalcode,
        row.city,
        row.country
      );
      return res.status(200).json(user);
    } else {
      return res.status(404).end();
    }
  });
});

userRouter.post("/register", (req, res, next) => {
  const { username, password, email } = req.body;
  const sql = `
    INSERT INTO user (uuid, username, password, email)
    VALUES (uuid(), ${pool.escape(username)}, SHA1(${pool.escape(
    password
  )}), ${pool.escape(email)})
  `;
  pool.query(sql, (err, rows) => {
    if (err) return next(err);
    if (rows.affectedRows > 0) {
      pool.query(
        `SELECT * FROM user WHERE id = ${rows.insertId}`,
        (err, rows) => {
          if (err) return next(err);
          if (rows.length > 0) {
            const { uuid, username, email } = rows[0];
            const usr = {
              uuid: uuid,
              username: username,
              email: email,
            };
            return res.status(200).json(usr);
          } else {
            return res.status(404).send(null);
          }
        }
      );
    } else {
      return res.status(404).send("0");
    }
  });
});

userRouter.put("/update", (req, res, next) => {
  const { id, firstName, lastName, sex, address, postalCode, city, country } =
    req.body;
  const sql = `
    UPDATE user
    SET firstname = ${pool.escape(firstName)},
        lastname = ${pool.escape(lastName)},
        sex = ${pool.escape(sex)},
        address = ${pool.escape(address)},
        postalcode = ${pool.escape(postalCode)},
        city = ${pool.escape(city)},
        country = ${pool.escape(country)}
    WHERE id = ${pool.escape(id)}
  `;
  pool.query(sql, (err) => {
    if (err) return next(err);
    return res.status(200).send(null);
  });
});

export class Loc {
  constructor(
    public uuid: string = "",
    public user_uuid: string = "",
    public user_name: string = "",
    public latitude: number = 0,
    public longitude: number = 0,
    public time: Date = new Date()
  ) {}
}

userRouter.post("/location", (req, res, next) => {
  const { user_uuid, latitude, longitude } = req.body;
  let user_id: number;
  let user_name: string;

  const userSql = `SELECT * FROM user WHERE uuid = ${pool.escape(user_uuid)}`;
  pool.query(userSql, (err, rws) => {
    if (err) return next(err);
    if (rws.length === 0) return res.status(405).send(user_uuid);

    user_id = rws[0].id;
    user_name = rws[0].username;

    const locationSql = `
      INSERT INTO location (uuid, userid, latitude, longitude)
      VALUES (uuid(), ${pool.escape(user_uuid)}, ${pool.escape(
      latitude
    )}, ${pool.escape(longitude)})
    `;
    pool.query(locationSql, (err, rows) => {
      if (err) return next(err);
      if (rows.affectedRows > 0) {
        console.log(JSON.stringify(rows));
        pool.query(
          `SELECT * FROM location WHERE id = ${rows.insertId}`,
          (err, rows) => {
            if (err) return next(err);
            if (rows.length > 0) {
              const row = rows[0];
              const loc = new Loc(
                row.uuid,
                user_uuid,
                user_name,
                row.latitude,
                row.longitude,
                row.time
              );
              return res.status(200).json(loc);
            }
          }
        );
      } else {
        return res.status(406).send(null);
      }
    });
  });
});

userRouter.get("/locations/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      user.id, 
      user.uuid as uuuid, 
      user.username as username, 
      location.uuid as luuid,
      location.latitude as lat, 
      location.longitude as lng, 
      location.time as time 
    FROM location INNER JOIN user ON location.userid = user.uuid
    WHERE user.uuid = ${pool.escape(id)} 
      AND location.userid = ${pool.escape(id)}
  `;
  pool.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error 2345, please call zid");
    } else {
      const data = rows.map(
        (row: any) =>
          new Loc(
            row.luuid,
            row.uuuid,
            row.username,
            row.lat,
            row.lng,
            row.time
          )
      );
      return res.status(200).json(data);
    }
  });
});
