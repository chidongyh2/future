import { Request, Response, NextFunction } from "express";
import { User } from "../sequelize";
import Logger from "../helpers/logger";
import utils from "../utils";

const isLogin = (req: Request, res: Response, next: NextFunction) => {
    // req.session.user = {
    //     id: 1,
    //     ugroup: "admin",
    //     username: "zxc"
    // }
    if(req.session.user) {
        res.locals.session = req.session;
        res.locals.utils = utils;
        next();
    } else {
        if(req.method === "GET") {
            res.render("login")
        } else {
            res.json({
                status: 0,
                msg: "Error validating user"
            })
        }
    }
}
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if(req.session.user.ugroup === "admin") {
        res.locals.session = req.session;
        res.locals.utils = utils;
        next();
    } else {
        if(req.method === "GET") {
            res.render("login");
        } else {
            res.json({
                status: 0,
                msg: "Error validating user"
            })
        }
    }
}
export {
    isLogin,
    isAdmin
}
export default {
    isLogin,
    isAdmin
}