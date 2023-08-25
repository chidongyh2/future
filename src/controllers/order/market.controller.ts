import { Request, Response, NextFunction } from "express";
import { OrderMarket, Binance, Coin, User } from "../../sequelize";
import Logger from "../../helpers/logger";
import { BodyAttributes } from "../../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../../utils/datatable";
const moment: any = null;
const viewOrderMarket = async(req: Request, res: Response, next: NextFunction) => {
    let accounts: any = await Binance.findAll({
        attributes: [["email", "name"], ["id", "value"]],
        raw: true
    });
    let coins: any = await Coin.findAll({
        attributes: [["symbol", "name"], ["symbol", "value"]],
        raw: true
    });
    let users: any = await User.findAll({
        attributes: [["username", "name"], ["id", "value"]],
        raw: true
    });
    res.render("data/list", {
        site: {
            title: "Lệnh Đang Chờ",
            key: "order_markets",
            type: "order",
            action: "order_markets",
            isDatatable: true,
            datatable: {
                url: "order/markets",
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
                    sorter: false,
                    defaultValue: users,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.User.username}</span>`
                    })
                }, {
                    title: "Binance",
                    dataIndex: "BinanceId",
                    keyIndex: "BinanceId",
                    filter: true,
                    sorter: false,
                    defaultValue: accounts,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.Binance.email}</span>`
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
                    title: "Side",
                    dataIndex: "positionSide",
                    keyIndex: "positionSide",
                    filter: true,
                    sorter: true,
                    defaultValue: [{
                        name: "LONG",
                        value: "LONG"
                    }, {
                        name: "SHORT",
                        value: "SHORT"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light-${data === "LONG" ? "success" : "danger"}">${data}</span>`
                    })
                }, {
                    title: "activation",
                    dataIndex: "activationPrice",
                    keyIndex: "activationPrice",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data} USDT</span>`
                    })
                }, {
                    title: "Price",
                    dataIndex: "price",
                    keyIndex: "price",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.price} USDT</span>`
                    })
                }, {
                    title: "Mark",
                    dataIndex: "markPrice",
                    keyIndex: "markPrice",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let markPercent = 0;
                        if(full.markPrice != 0) {
                            if(full.positionSide === "LONG") {
                                markPercent = ((full.activationPrice / full.markPrice) * 100) - 100;
                            } else {
                                markPercent = ((full.markPrice / full.activationPrice) * 100) - 100;
                            }
                        }
                        return `<span class="badge badge-light-primary">${full.markPrice} USDT (${markPercent.toFixed(2)}%)</span>`
                    })
                }, {
                    title: "trailing",
                    dataIndex: "trailing",
                    keyIndex: "trailing",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let price = Number(full.price);
                        let markPrice = Number(full.markPrice);
                        let positionSide = full.positionSide;
                        if(price != 0 && markPrice != 0) {
                            let percent = 0;
                            if(positionSide === "LONG") {
                                percent = Number((100 - (markPrice * 100) / price).toFixed(2));
                            } else {
                                percent = Number((100 - (price * 100) / markPrice).toFixed(2));
                            }
                            return `<span class="badge badge-light">${percent}%</span>`
                        } else {
                            return `<span class="badge badge-light">0%</span>`
                        }
                    })
                }, {
                    title: "Time",
                    dataIndex: "updatedAt",
                    keyIndex: "updatedAt",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${moment(data).format("DD-MM-YYYY HH:mm:ss")}</span>`;
                    })
                }, {
                    title: "Status",
                    dataIndex: "status",
                    keyIndex: "status",
                    filter: true,
                    sorter: false,
                    defaultValue: [{
                        name: "Processing",
                        value: "processing"
                    }, {
                        name: "Filled",
                        value: "filled"
                    }, {
                        name: "Error",
                        value: "error"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-${data === "processing"  ? "primary" : "success"}">${data}</span>`
                    })
                }]
            }
        }
    })
}
const getOrderMarket = (req: Request, res: Response, next: NextFunction) => {
    let body: BodyAttributes = req.body;
	let info = getInfo(body);
    if(req.session.user.ugroup != "admin") {
        info.where = {
            ...info.where,
            UserId: req.session.user.id
        }
    }
    OrderMarket.findAndCountAll({
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
    viewOrderMarket,
    getOrderMarket
}
export default {
    viewOrderMarket,
    getOrderMarket
}