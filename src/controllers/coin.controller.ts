import { Request, Response, NextFunction, request } from "express";
import { Coin, Binance, OrderMarket, OrderTrailing } from "../sequelize";
import Logger from "../helpers/logger";
import { BodyAttributes } from "../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../utils/datatable";
import BinanceApi from "binance-api-node";
import { generateKey } from "../utils/cache";
import { redis } from "../redis";
import { BinanceAttributes } from "../models/binance.model";
import { getTime, closeOrder, closeOneOrder } from "../utils/binance";
const listCoin = (): Promise<{
    name: string,
    value: string
}[]> => {
    return new Promise((resolve, reject) => {
        let key = generateKey({
            type: "all_symbol"
        });
        redis.get(key, async(err, values) => {
            if(err || !values) {
                let account = await Binance.findOne({
                    where: {
                        active: true
                    },
                    raw: true
                });
                if(account) {
                    let binance = BinanceApi({
                        apiKey: account.apiKey,
                        apiSecret: account.apiSecret
                    });
                    binance.futuresAccountInfo().then((json) => {
                        let data = [];
                        let names: string[] = [];
                        for(const item of json.positions) {
                            if(!names.includes(item.symbol)) {
                                data.push({
                                    name: item.symbol,
                                    value: item.symbol
                                })
                                names.push(item.symbol);
                            }
                        }
                        redis.set(key, JSON.stringify(data), "ex", 86400);
                        resolve(data);
                    }).catch((err) => {
                        Logger.error(err);
                        resolve([]);
                    });
                } else {
                    resolve([]);
                }
            } else {
                try {
                    resolve(JSON.parse(values));
                } catch(ex) {
                    resolve([]);
                }
            }
        });
    })
}
const list = async (req: Request, res: Response, next: NextFunction) => {
    res.render("data/list", {
        site: {
            title: "Coin",
            key: "coin",
            type: "coin",
            action: "list",
            isDatatable: true,
            datatable: {
                isAdd: true,
                isAddMulti: true,
                isEdit: true,
                isDelete: true,
                url: "coin",
                listData: [{
                    title: "id",
                    dataIndex: "id",
                    keyIndex: "id",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<div className="form-check form-check-sm form-check-custom form-check-solid">
                            <input className="form-check-input check-ids" type="checkbox" value=${data} />
                        </div>`
                    })
                }, {
                    title: "Coin",
                    dataIndex: "symbol",
                    keyIndex: "symbol",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "D.Price",
                    dataIndex: "decimalPrice",
                    keyIndex: "decimalPrice",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "D.Size",
                    dataIndex: "decimalSize",
                    keyIndex: "decimalSize",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "Min",
                    dataIndex: "min",
                    keyIndex: "min",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "Active",
                    dataIndex: "active",
                    keyIndex: "active",
                    filter: true,
                    sorter: true,
                    defaultValue: [{
                        name: "True",
                        value: "true"
                    }, {
                        name: "False",
                        value: "false"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-${data === true ? "success" : "danger"}">${data === true ? "Active" : "Deactive"}</span>`
                    })
                }],
                multiData: [{
                    title: "List Coin",
                    keyIndex: "listCoin",
                    type: "textarea",
                    placeholder: "BTCUSDT|D.Price|D.Size|Min",
                    required: true
                }],
                addData: [{
                    title: "SYMBOL",
                    keyIndex: "symbol",
                    type: "select2",
                    placeholder: "BTCUSDT",
                    defaultValue: await listCoin(),
                    dropdown: "kt_modal_add_form",
                    required: true
                }, {
                    title: "Decimal Price",
                    keyIndex: "decimalPrice",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    max: "5",
                    required: true
                }, {
                    title: "Decimal Size",
                    keyIndex: "decimalSize",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    max: "5",
                    required: true
                }, {
                    title: "Min",
                    keyIndex: "min",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    required: true
                }, {
                    title: "Active",
                    keyIndex: "active",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }],
                editData: [{
                    title: "id",
                    keyIndex: "id",
                    type: "hidden",
                    required: true
                }, {
                    title: "SYMBOL",
                    keyIndex: "symbol",
                    type: "select2",
                    placeholder: "BTCUSDT",
                    defaultValue: await listCoin(),
                    dropdown: "kt_modal_edit_form",
                    required: true
                }, {
                    title: "Decimal Price",
                    keyIndex: "decimalPrice",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    max: "5",
                    required: true
                }, {
                    title: "Decimal Size",
                    keyIndex: "decimalSize",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    max: "5",
                    required: true
                }, {
                    title: "Min",
                    keyIndex: "min",
                    type: "input",
                    validate: "number",
                    placeholder: "1",
                    min: "0",
                    required: true
                }, {
                    title: "Active",
                    keyIndex: "active",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }]
            }
        }
    })
}
const add = (req: Request, res: Response, next: NextFunction) => {
    let { symbol, decimalPrice, decimalSize, min, active } = req.body;
    Coin.count({
        where: {
            symbol
        }
    }).then((count) => {
        if(count === 0) {
            Coin.create({
                symbol,
                decimalPrice,
                decimalSize,
                min,
                active
            }).then(() => {
                res.json({
                    status: 1,
                    msg: "Thêm coin thành công"
                });
            }).catch((err) => {
                Logger.error(err);
                next({
                    status: 500,
                    msg: "Error"
                })
            })
        } else {
            next({
                status: 500,
                msg: "Coin đã tồn tại"
            })
        }
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const addMulti = async(req: Request, res: Response, next: NextFunction) => {
    let { listCoin } = req.body;
    let list = listCoin.trim().split("\n");
    let stt = 0;
    for(const item of list) {
        let info = item.split("|");
        let symbol = info[0];
        let decimalPrice = info[1];
        let decimalSize = info[2];
        let min = info[3];
        await Coin.create({
            symbol,
            decimalPrice,
            decimalSize,
            active: true
        }).then(() => {
            stt++;
        }).catch(() => null);
    }
    res.json({
        status: 1,
        msg: `Thêm thành công ${stt} coin`
    })
}
const info = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.params;
    Coin.findOne({
        where: {
            id
        }
    }).then((data) => {
        if (data != null) {
            res.json({
                status: 1,
                data
            })
        } else {
            next({
                status: 404,
                msg: "Not found"
            })
        }
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const edit = async(req: Request, res: Response, next: NextFunction) => {
    let { id, symbol, decimalPrice, decimalSize, min, active } = req.body;
    Coin.update({
        symbol,
        decimalPrice,
        decimalSize,
        min,
        active
    }, {
        where: {
            id
        }
    }).then(() => {
        res.json({
            status: 1,
            msg: "Update success"
        })
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const closeAllSymbol = (symbol: string) => {
    return new Promise(async(resolve, reject) => {
        let accounts = await Binance.findAll({
            where: {
                active: true
            },
            raw: true
        });
        for(const account of accounts) {
            await closeOne(account, symbol);
        }
        resolve("OK");
    })
}
const closeOne = (account: BinanceAttributes, symbol: string) => {
    return new Promise((resolve, reject) => {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        binance.futuresPositionRisk({
            recvWindow: 10000
        }).then(async(orders) => {
            let filters: any = orders.filter((item) => item.entryPrice != "0.0" && item.symbol === symbol);
            await closeOrder(account, symbol, filters);
            resolve(`Close order ${symbol} thành công`);
        }).catch((err) => {
            Logger.error(err);
            reject(err);
        });
    })
}
const del = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    Coin.findOne({
        where: {
            id
        },
        raw: true
    }).then(async(data) => {
        if(data) {
            await Coin.destroy({
                where: {
                    id
                }
            });
            await OrderTrailing.destroy({
                where: {
                    symbol: data.symbol
                }
            })
            await OrderMarket.destroy({
                where: {
                    symbol: data.symbol
                }
            });
            await closeAllSymbol(data.symbol);
            res.json({
                status: 1,
                msg: "Xoá thành công"
            })
        } else {
            res.json({
                status: 0,
                msg: "Không tìm thấy dữ liệu"
            })
        }
    }).catch((err) => {
        Logger.error(err);
        res.json({
            status: 0,
            msg: "Đã xảy ra lỗi"
        })
    });
}
const ajax = (req: Request, res: Response, next: NextFunction) => {
    let body: BodyAttributes = req.body;
    let info = getInfo(body);
    info.where = {
        ...info.where
    }
    Coin.findAndCountAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order
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
    list,
    add,
    info,
    edit,
    del,
    ajax,
    addMulti,
    listCoin
}
export default {
    list,
    add,
    info,
    edit,
    del,
    ajax,
    addMulti,
    listCoin
}