import { Binance, Profit, User } from "../../sequelize";
import BinanceApi from "binance-api-node";
import { Request, Response, NextFunction } from "express";
import { convertFuncToString, getInfo } from "../../utils/datatable";
import { BodyAttributes } from "../../typings/datatable";
import Logger from "../../helpers/logger";
import { fn, col, Op } from "sequelize";
import getSetting from "../../utils/setting";
import { getTime } from "../../utils/binance";
const viewOverview = async(req: Request, res: Response, next: NextFunction) => {
    let users: any = await User.findAll({
        attributes: [["username", "name"], ["id", "value"]],
        order: [
            ["id", "ASC"]
        ],
        raw: true
    });
    res.render("data/list", {
        site: {
            title: "Tổng Quan",
            key: "overview",
            type: "statistics",
            action: "overview",
            isDatatable: true,
            datatable: {
                url: "statistics/overview",
                listData: [{
                    title: "id",
                    dataIndex: "id",
                    keyIndex: "id",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return data;
                    })
                }, {
                    title: "User",
                    dataIndex: "UserId",
                    keyIndex: "UserId",
                    filter: true,
                    sorter: true,
                    isAdmin: true,
                    defaultValue: users,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.User.username}</span>`;
                    })
                }, {
                    title: "email",
                    dataIndex: "email",
                    keyIndex: "email",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-success">${data}</span>`;
                    })
                }, {
                    title: "Balance",
                    dataIndex: "balance",
                    keyIndex: "balance",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(data);
                        return `<span class="badge badge-primary">${val.toFixed(4)} USDT</span>`;
                    })
                }, {
                    title: "Vốn",
                    dataIndex: "capital",
                    keyIndex: "capital",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${Number(data).toFixed(4)} USDT</span>`;
                    })
                }, {
                    title: "PNL1",
                    dataIndex: "pnl",
                    keyIndex: "pnl",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(full.balance) - Number(full.capital);
                        return `<span class="badge badge-${val >= 0 ? "success" : "danger"}">${val.toFixed(4)} USDT</span>`;
                    })
                }, {
                    title: "PNL2",
                    dataIndex: "pnl",
                    keyIndex: "pnl",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(data);
                        return `<span class="badge badge-${val >= 0 ? "success" : "danger"}">${val.toFixed(4)} USDT</span>`;
                    })
                }, {
                    title: "Percent",
                    dataIndex: "percent",
                    keyIndex: "percent",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let capital = Number(full.capital); // vốn
                        // let balance = Number(full.balance); // số dư hiện tại
                        let balance = Number(full.capital) + Number(full.pnl); // số tiền đã kiếm đc
                        let percent = (balance / capital * 100) - 100;
                        return `<span class="badge badge-${percent > 0 ? "success" : "danger"}">${percent.toFixed(2)}%</span>`;
                    })
                }]
            }
        }
    })
}
const getOverview = (req: Request, res: Response, next: NextFunction) => {
    let body: BodyAttributes = req.body;
	let info = getInfo(body);
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
                        BinanceId: info.id
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
export {
    viewOverview,
    getOverview
}
export default {
    viewOverview,
    getOverview
}