import { Request, Response, NextFunction } from "express";
import { Profit, Binance, User, Coin } from "../../sequelize";
import Logger from "../../helpers/logger";
import { BodyAttributes } from "../../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../../utils/datatable";
import { Op } from "sequelize";
const moment: any = null;
const viewProfit = async(req: Request, res: Response, next: NextFunction) => {
    let accounts: any = await Binance.findAll({
        attributes: [["email", "name"], ["id", "value"]],
        raw: true
    });
    let users: any = await User.findAll({
        attributes: [["username", "name"], ["id", "value"]],
        order: [
            ["id", "ASC"]
        ],
        raw: true
    });
    let coins: any = await Coin.findAll({
        attributes: [["symbol", "name"], ["id", "value"]],
        where: {
            active: true
        },
        raw: true
    });
    res.render("data/list", {
        site: {
            title: "Lợi Nhuận",
            key: "profit",
            type: "statistics",
            action: "profit",
            isDatatable: true,
            datatable: {
                url: "statistics/profit",
                filterDate: true,
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
                    defaultValue: users,
                    isAdmin: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.User.username}</span>`
                    })
                }, {
                    title: "Binance",
                    dataIndex: "BinanceId",
                    keyIndex: "BinanceId",
                    filter: true,
                    sorter: true,
                    defaultValue: accounts,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-success">${full.Binance.email}</span>`
                    })
                }, {
                    title: "Symbol",
                    dataIndex: "symbol",
                    keyIndex: "symbol",
                    filter: true,
                    sorter: true,
                    defaultValue: coins,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "Margin",
                    dataIndex: "margin",
                    keyIndex: "margin",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${Number(data).toFixed(4)} USDT</span>`
                    })
                }, {
                    title: "PNL",
                    dataIndex: "pnl",
                    keyIndex: "pnl",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(data);
                        return `<span class="badge badge-${val > 0 ? "success" : "danger"}">${val.toFixed(4)} USDT</span>`
                    })
                }, {
                    title: "Content",
                    dataIndex: "content",
                    keyIndex: "content",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        try {
                            let json = JSON.parse(data);
                            let html = ``;
                            for(const item of json) {
                                let pnl = Number(item.unRealizedProfit);
                                html += `<span class="badge badge-${pnl > 0 ? "success" : "danger"}">${item.positionSide[0]}: ${pnl.toFixed(2)} USDT (${item.percent}%)</span> `;
                            }
                            return html;
                        } catch(ex) {
                            return "";
                        }
                    })
                }, {
                    title: "Time",
                    dataIndex: "createdAt",
                    keyIndex: "createdAt",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${moment(data).format("DD-MM-YYYY HH:mm:ss")}</span>`;
                    })
                }]
            }
        }
    })
}
const getProfit = (req: Request, res: Response, next: NextFunction) => {
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
    Profit.findAndCountAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order,
        include: [{
            model: Binance
        }, {
            model: User
        }]
    }).then((values) => {
        let data = values.rows;
		let total = values.count;
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
    viewProfit,
    getProfit
}
export default {
    viewProfit,
    getProfit
}