"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loc = exports.userRouter = void 0;
const express = __importStar(require("express"));
const db_1 = require("../config/db");
const user_1 = require("../model/user");
exports.userRouter = express.Router();
exports.userRouter.post("/login", (req, res, next) => {
    const { username, password } = req.body;
    const sql = `
    SELECT * FROM user
    WHERE username = ${db_1.pool.escape(username)}
      AND password = SHA1(${db_1.pool.escape(password)})
  `;
    db_1.pool.query(sql, (err, rows) => {
        if (err)
            return next(err);
        if (rows.length > 0) {
            const row = rows[0];
            const user = new user_1.User(row.uuid, row.username, row.email, "", row.is_admin, row.firstname, row.lastname, row.sex, row.address, row.postalcode, row.city, row.country);
            return res.status(200).json(user);
        }
        else {
            return res.status(404).end();
        }
    });
});
exports.userRouter.post("/register", (req, res, next) => {
    const { username, password, email } = req.body;
    const sql = `
    INSERT INTO user (uuid, username, password, email)
    VALUES (uuid(), ${db_1.pool.escape(username)}, SHA1(${db_1.pool.escape(password)}), ${db_1.pool.escape(email)})
  `;
    db_1.pool.query(sql, (err, rows) => {
        if (err)
            return next(err);
        if (rows.affectedRows > 0) {
            db_1.pool.query(`SELECT * FROM user WHERE id = ${rows.insertId}`, (err, rows) => {
                if (err)
                    return next(err);
                if (rows.length > 0) {
                    const { uuid, username, email } = rows[0];
                    const usr = {
                        uuid: uuid,
                        username: username,
                        email: email,
                    };
                    return res.status(200).json(usr);
                }
                else {
                    return res.status(404).send(null);
                }
            });
        }
        else {
            return res.status(404).send("0");
        }
    });
});
exports.userRouter.put("/update", (req, res, next) => {
    const { id, firstName, lastName, sex, address, postalCode, city, country } = req.body;
    const sql = `
    UPDATE user
    SET firstname = ${db_1.pool.escape(firstName)},
        lastname = ${db_1.pool.escape(lastName)},
        sex = ${db_1.pool.escape(sex)},
        address = ${db_1.pool.escape(address)},
        postalcode = ${db_1.pool.escape(postalCode)},
        city = ${db_1.pool.escape(city)},
        country = ${db_1.pool.escape(country)}
    WHERE id = ${db_1.pool.escape(id)}
  `;
    db_1.pool.query(sql, (err) => {
        if (err)
            return next(err);
        return res.status(200).send(null);
    });
});
class Loc {
    constructor(uuid = "", user_uuid = "", user_name = "", latitude = 0, longitude = 0, time = new Date()) {
        this.uuid = uuid;
        this.user_uuid = user_uuid;
        this.user_name = user_name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.time = time;
    }
}
exports.Loc = Loc;
exports.userRouter.post("/location", (req, res, next) => {
    const { user_uuid, latitude, longitude } = req.body;
    let user_id;
    let user_name;
    const userSql = `SELECT * FROM user WHERE uuid = ${db_1.pool.escape(user_uuid)}`;
    db_1.pool.query(userSql, (err, rws) => {
        if (err)
            return next(err);
        if (rws.length === 0)
            return res.status(405).send(user_uuid);
        user_id = rws[0].id;
        user_name = rws[0].username;
        const locationSql = `
      INSERT INTO location (uuid, userid, latitude, longitude)
      VALUES (uuid(), ${db_1.pool.escape(user_uuid)}, ${db_1.pool.escape(latitude)}, ${db_1.pool.escape(longitude)})
    `;
        db_1.pool.query(locationSql, (err, rows) => {
            if (err)
                return next(err);
            if (rows.affectedRows > 0) {
                console.log(JSON.stringify(rows));
                db_1.pool.query(`SELECT * FROM location WHERE id = ${rows.insertId}`, (err, rows) => {
                    if (err)
                        return next(err);
                    if (rows.length > 0) {
                        const row = rows[0];
                        const loc = new Loc(row.uuid, user_uuid, user_name, row.latitude, row.longitude, row.time);
                        return res.status(200).json(loc);
                    }
                });
            }
            else {
                return res.status(406).send(null);
            }
        });
    });
});
exports.userRouter.get("/locations/:id", (req, res) => {
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
    WHERE user.uuid = ${db_1.pool.escape(id)} 
      AND location.userid = ${db_1.pool.escape(id)}
  `;
    db_1.pool.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("server error 2345, please call zid");
        }
        else {
            const data = rows.map((row) => new Loc(row.luuid, row.uuuid, row.username, row.lat, row.lng, row.time));
            return res.status(200).json(data);
        }
    });
});
