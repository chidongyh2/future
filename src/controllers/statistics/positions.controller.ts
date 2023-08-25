import { Binance, User } from "../../sequelize";
import BinanceApi from "binance-api-node";
import { Request, Response, NextFunction } from "express";
import { convertFuncToString, getInfo, getInfoStatistics } from "../../utils/datatable";
import { listCoin } from "../coin.controller";
import { BodyAttributes } from "../../typings/datatable";
import { getTime } from "../../utils/binance";
import { groupByKey } from "../../utils";
import Logger from "../../helpers/logger";
// import moment from "moment";
const moment: any = null;
const viewPositions = async(req: Request, res: Response) => {
    let where = {};
    if(req.session.user.ugroup != "admin") {
        where = {
            UserId: req.session.user.id
        }
    }
    let accounts: any = await Binance.findAll({
        attributes: [["email", "name"], ["id", "value"]],
        where,
        order: [
            ["id", "ASC"]
        ],
        raw: true
    });
    res.render("statistics/all", {
        site: {
            title: "Vị Thế",
            key: "statistics",
            type: "statistics",
            action: "positions",
            isDatatable: true,
            list: {
                accounts
            },
            datatable: {
                url: "statistics/positions",
                listData: [{
                    title: "Account",
                    dataIndex: "accountId",
                    keyIndex: "accountId",
                    filter: true,
                    sorter: false,
                    defaultValue: accounts,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.Account.email}</span>`
                    })
                }, {
                    title: "Coin",
                    dataIndex: "symbol",
                    keyIndex: "symbol",
                    filter: true,
                    sorter: false,
                    defaultValue: await listCoin(),
                    render: convertFuncToString((data, type, full, meta) => {
                        let side = Number(full.positionAmt) > 0 ? "L" : "S";
                        return `<span class="badge badge-${side === "L" ? "success" : "danger"}">${data}</span>`;
                    })
                }, {
                    title: "Size",
                    dataIndex: "positionAmt",
                    keyIndex: "positionAmt",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`;
                    })
                }, {
                    title: "Entry",
                    dataIndex: "entryPrice",
                    keyIndex: "entryPrice",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${Number(data).toFixed(4)}</span>`;
                    })
                }, {
                    title: "Margin",
                    dataIndex: "marginType",
                    keyIndex: "marginType",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let margin = Number(Math.abs(Number(full.notional)) / Number(full.leverage));
                        return `<span class="badge badge-light">${Number(margin).toFixed(4)}</span>`;
                    })
                }, {
                    title: "Liq.Price",
                    dataIndex: "liquidationPrice",
                    keyIndex: "liquidationPrice",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${Number(data).toFixed(4)}</span>`;
                    })
                }, {
                    title: "PNL",
                    dataIndex: "unRealizedProfit",
                    keyIndex: "unRealizedProfit",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(data);
                        return `<span class="badge badge-${val > 0 ? "success" : "danger"}">${Number(val).toFixed(4)}</span>`;
                    })
                }, {
                    title: "PNL%",
                    dataIndex: "unRealizedProfit",
                    keyIndex: "unRealizedProfit",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        let val = Number(data);
                        let margin = Number(Math.abs(Number(full.notional)) / Number(full.leverage));
                        let PNL = Number((val * 100 / margin).toFixed(2));
                        return `<span class="badge badge-${val > 0 ? "success" : "danger"}">${Number(PNL).toFixed(2)}%</span>`;
                    })
                }]
            }
        }
    })
}
const getPositions = async(req: Request, res: Response, next: NextFunction) => {
    let body: BodyAttributes = req.body;
    let info = getInfoStatistics(body);
    let account: any = null;
    let filter = info.where.filter((arr: any) => arr.data === "accountId");
    if(filter.length > 0) {
        let id = filter[0].search.value;
        let where: any = {
            id,
            active: true
        }
        if(req.session.user.ugroup != "admin") {
            where = {
                ...where,
                UserId: req.session.user.id
            }
        }
        account = await Binance.findOne({
            where,
            raw: true
        }).catch(() => null);
    } else {
        let where: any = {
            active: true
        }
        if(req.session.user.ugroup != "admin") {
            where = {
                ...where,
                UserId: req.session.user.id
            }
        }
        account = await Binance.findOne({
            where,
            order: [
                ["id", "ASC"]
            ],
            raw: true
        }).catch(() => null);
    }
    if(account) {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        binance.futuresPositionRisk({
            recvWindow: 10000
        }).then((array: any) => {
            array = array.filter((arr: any) => arr.entryPrice != "0.0");
            // search
            if(info.where.length > 0) {
                let filters = info.where.filter((arr: any) => arr.data != "accountId");
                for(const item of filters) {
                    try {
                        array = array.filter((arr: any) => arr[item.data] === item.search.value);
                    } catch(ex) {

                    }
                }
            }
            let data = [];
            for(const item of array) {
                data.push({
                    ...item,
                    Account: account,
                    AccountId: account.id
                })
            }
            res.json({
                status: 1,
                data,
                pages: 1,
                recordsFiltered: data.length,
                recordsTotal: data.length
            });
        }).catch((err) => {
            Logger.error(err);
            res.json({
                status: 0,
                msg: "Đã xảy ra lỗi"
            })
        });
    } else {
        res.json({
            status: 0,
            msg: "Không tìm thấy tài khoản"
        })
    }
}
export {
    viewPositions,
    getPositions
}
export default {
    viewPositions,
    getPositions
}