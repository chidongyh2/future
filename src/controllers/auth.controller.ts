import { Request, Response, NextFunction } from "express";
import Crypto from "crypto-js";
import { User } from "../sequelize";
import Logger from "../helpers/logger";
const generateUser = (req: Request, res: Response, next: NextFunction) => {
    let { username, password } = req.query;
    if(username && password) {
        User.count().then((count) => {
            if(count === 0) {
                User.create({
                    username: String(username),
                    password: Crypto.MD5(String(password)).toString(),
                    ugroup: "admin"
                }).then(() => {
                    res.json({
                        status: 1
                    })
                }).catch((err) => {
                    Logger.error(err);
                    next({
                        status: 404,
                        msg: "Notfound"
                    })
                })
            } else {
                next({
                    status: 404,
                    msg: "Notfound"
                })
            }
        })
    } else {
        next({
            status: 404,
            msg: "Notfound"
        })
    }
}
const loginUser = (req: Request, res: Response, next: NextFunction) => {
    let { username, password } = req.body;
    User.findOne({
        where: {
            username
        },
        raw: true,
        nest: true
    }).then(async(user) => {
        if(user) {
            if(Crypto.MD5(password).toString() === user.password) {
                req.session.user = user;
                res.json({
                    status: 1,
                    msg: "Login success"
                })
            } else {
                next({
                    status: 401,
                    msg: "The login detail is incorrect"
                })
            }
        } else {
            next({
                status: 401,
                msg: "The login detail is incorrect"
            })
        }
    })
}
const getUser = (req: Request, res: Response) => {
    res.json({
        ...req.user
    })
}
export {
    generateUser,
    loginUser,
    getUser
}
export default {
    generateUser,
    loginUser,
    getUser
}