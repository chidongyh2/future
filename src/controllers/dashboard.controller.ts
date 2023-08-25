import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { BodyAttributes } from "../typings/datatable";
import { getInfo } from "../utils/datatable";
import { Profit, Coin, User, Binance } from "../sequelize";
const Dashboard = async(req: Request, res: Response) => {
    let users: any = await User.findAll({
        attributes: [["username", "name"], ["id", "value"]],
        raw: true
    });
    let binances: any = await Binance.findAll({
        attributes: [["email", "name"], ["id", "value"]],
        raw: true
    });
    res.render("dashboard", {
        site: {
            title: "Dashboard",
            key: "dashboard",
            type: "dashboard",
            list: {
                users,
                binances
            }
        }
    });
}
const Logout = (req: Request, res: Response) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
}
export {
    Dashboard,
    Logout
}
export default {
    Dashboard,
    Logout
}