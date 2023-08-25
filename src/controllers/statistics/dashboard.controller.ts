import { Binance, Profit, User } from "../../sequelize";
import BinanceApi from "binance-api-node";
import { Request, Response, NextFunction } from "express";
import { getInfo } from "../../utils/datatable";
import { BodyAttributes } from "../../typings/datatable";
import Logger from "../../helpers/logger";
import { fn, col, Op, literal } from "sequelize";
import { getTime } from "../../utils/binance";
import moment from "moment";
const getTableOverview = (req: Request, res: Response, next: NextFunction) => {
    let select = req.params.select;
    let body: BodyAttributes = req.body;
	let info = getInfo(body);
    let whereProfit = {};
    if(req.session.user.ugroup != "admin") {
        info.where = {
            ...info.where,
            UserId: req.session.user.id
        }
    } else {
        // if(!info.where[Op.and] && !info.where[Op.or]) {
        //     info.where = {
        //         UserId: req.session.user.id
        //     }
        // }
    }
    if(select != "all") {
        if(select === "day") {
            let start = new Date();
            start.setHours(0,0,0,0);
            let end = new Date();
            end.setHours(23,59,59,999);
            whereProfit = {
                [Op.and]: [{
                    createdAt: {
                        [Op.gte]: start
                    }
                }, {
                    createdAt: {
                        [Op.lte]: end
                    }
                }]
            }
        }
        if(select === "week") {
            let start = new Date(moment().startOf('week').toString());
            start.setHours(0,0,0,0);
            let end = new Date(moment().endOf('week').toString());
            end.setHours(23,59,59,999);
            whereProfit = {
                [Op.and]: [{
                    createdAt: {
                        [Op.gte]: start
                    }
                }, {
                    createdAt: {
                        [Op.lte]: end
                    }
                }]
            }
        }
        if(select === "month") {
            let start = new Date(moment().startOf('month').toString());
            start.setHours(0,0,0,0);
            let end = new Date(moment().endOf('month').toString());
            end.setHours(23,59,59,999);
            whereProfit = {
                [Op.and]: [{
                    createdAt: {
                        [Op.gte]: start
                    }
                }, {
                    createdAt: {
                        [Op.lte]: end
                    }
                }]
            }
        }
    }
    Binance.findAndCountAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order,
        include: [{
            model: User
        }]
    }).then(async(values) => {
        let array = values.rows;
		let total = values.count;
        let data: any = [];
        for(const item of array) {
            let info = item.get({
                plain: true
            });
            // get balance
            try {
                let binance = BinanceApi({
                    apiKey: info.apiKey,
                    apiSecret: info.apiSecret,
                    getTime
                });
                let balances = await binance.futuresAccountBalance({
                    recvWindow: 10000
                });
                let balance: any = balances.filter((item: any) => item.asset === "USDT");
                if(balance.length > 0) {
                    balance = balance[0].balance;
                } else {
                    balance = balances[0].balance;
                }
                // get profit
                let profit = await Profit.findAll({
                    where: {
                        ...whereProfit,
                        BinanceId: info.id,
                    },
                    attributes: [
                        [fn('SUM', col('pnl')), 'pnl']
                    ],
                    raw: true
                });
                if(profit.length > 0) {
                    data.push({
                        ...info,
                        pnl: profit[0].pnl,
                        balance
                    })
                } else {
                    data.push({
                        ...info,
                        pnl: 0,
                        balance
                    })
                }
            } catch(ex) {
                // Logger.error(ex);
                data.push({
                    ...info,
                    pnl: 0,
                    balance: 0
                })
            }
        }
		res.json({
			status: 1,
			data,
			recordsTotal: total,
			recordsFiltered: total,
			pages: Math.ceil(total / info.limit),
		});
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const getChartProfit = (req: Request, res: Response) => {
    let { UserId, BinanceId, symbol, dateRange } = req.body;
    let where: any = {};
    if(req.session.user.ugroup === "admin") {
        if(UserId) {
            where = {
                ...where,
                UserId
            }
        }
        if(BinanceId) {
            where = {
                ...where,
                BinanceId
            }
        }
        if(symbol) {
            where = {
                ...where,
                symbol
            }
        }
    } else {
        if(BinanceId) {
            where = {
                ...where,
                BinanceId
            }
        }
        if(symbol) {
            where = {
                ...where,
                symbol
            }
        }
        where = {
            ...where,
            UserId: req.session.user.id
        }
    }
    if(dateRange) {
        try {
            let info = dateRange.split(" - ");
            let start = new Date(info[0].trim());
            start.setHours(0,0,0,0);
            let end = new Date(info.pop().trim());
            end.setHours(23,59,59,999);
            where = {
                ...where,
                [Op.and]: [{
                    createdAt: {
                        [Op.gte]: start
                    }
                }, {
                    createdAt: {
                        [Op.lte]: end
                    }
                }]
            }
        } catch(ex) {
            console.error(ex);
        }
    }
    Profit.findAll({
        where: {
            ...where,
        },
        attributes: [
            [fn("SUM", col("pnl")), "pnl"],
            [fn("DATE", col("created_at")), "date"]
        ],
        group: [fn("DATE", col("created_at")), "date"],
        raw: true
    }).then((data) => {
        res.json({
            status: 0,
            data
        })
    });
}
const getChartBinance = (req: Request, res: Response) => {
    let { dateRange } = req.body;
    let where: any = {};
    if(req.session.user.ugroup != "admin") {
        where = {
            ...where,
            UserId: req.session.user.id
        }
    }
    if(dateRange) {
        try {
            let info = dateRange.split(" - ");
            let start = new Date(info[0].trim());
            start.setHours(0,0,0,0);
            let end = new Date(info.pop().trim());
            end.setHours(23,59,59,999);
            where = {
                ...where,
                [Op.and]: [{
                    createdAt: {
                        [Op.gte]: start
                    }
                }, {
                    createdAt: {
                        [Op.lte]: end
                    }
                }]
            }
        } catch(ex) {
            console.error(ex);
        }
    }
    Profit.findAll({
        where,
        attributes: [
            [fn("SUM", col("pnl")), "pnl"],
            "BinanceId",
        ],
        group: [
            "BinanceId"
        ],
        include: [{
            model: Binance
        }]
    }).then((data) => {
        res.json({
            status: 1,
            data
        })
    }).catch((err) => {
        console.error(err);
        res.json({
            status: 0,
            msg: "Đã xảy ra lỗi"
        })
    })
}
export {
    getTableOverview,
    getChartProfit,
    getChartBinance
}
export default {
    getTableOverview,
    getChartProfit,
    getChartBinance
}