import { Request, Response, NextFunction } from "express";
import { Binance, Coin, OrderTrailing, OrderMarket, Profit, User } from "../sequelize";
import Logger from "../helpers/logger";
import { BodyAttributes } from "../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../utils/datatable";
import BinanceApi from "binance-api-node";
import { clearCache } from "../utils/cache";
import getSetting from "../utils/setting";
import { groupByKey } from "../utils";
import { getTime, closeOrder } from "../utils/binance";
import { Op } from "sequelize";
const list = async (req: Request, res: Response) => {
    let coins: any = await Coin.findAll({
        attributes: [["symbol", "name"], ["id", "value"]],
        where: {
            active: true
        },
        raw: true
    });
    let users: any = await User.findAll({
        attributes: [["username", "name"], ["id", "value"]],
        raw: true
    });
    res.render("data/list", {
        site: {
            title: "Binance",
            key: "binance",
            type: "binance",
            action: "list",
            isDatatable: true,
            datatable: {
                isAdd: true,
                isEdit: true,
                isDelete: true,
                isCloseAll: true,
                isCloseOrder: true,
                isCheck: true,
                isGetBalance: true,
                url: "binance",
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
                        return `<span class="badge badge-success">${full.User.username}</span>`
                    })
                }, {
                    title: "Email",
                    dataIndex: "email",
                    keyIndex: "email",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return data
                    })
                }, {
                    title: "Coins",
                    dataIndex: "Coins",
                    keyIndex: "Coins",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${full.Coins.length} Coins</span>`;
                    })
                }, {
                    title: "Balance",
                    dataIndex: "balance",
                    keyIndex: "balance",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span id="balance-${full.id}" class="badge badge-success">0 USDT</span>`;
                    })
                }, {
                    title: "PNL",
                    dataIndex: "crossUnPnl",
                    keyIndex: "crossUnPnl",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span id="pnl-${full.id}" class="badge badge-success">0 USDT</span>`;
                    })
                }, {
                    title: "Info",
                    dataIndex: "isAuto",
                    keyIndex: "isAuto",
                    filter: false,
                    sorter: false,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<button title="Auto" class="btn btn-icon btn-sm btn-light-${full.isAuto === true ? "success" : "danger"}">
                                    <!--begin::Svg Icon | path: assets/media/icons/duotune/abstract/abs035.svg-->
                                    <span class="svg-icon svg-icon-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path opacity="0.3" d="M19.0687 17.9688H11.0687C10.4687 17.9688 10.0687 18.3687 10.0687 18.9688V19.9688C10.0687 20.5687 10.4687 20.9688 11.0687 20.9688H19.0687C19.6687 20.9688 20.0687 20.5687 20.0687 19.9688V18.9688C20.0687 18.3687 19.6687 17.9688 19.0687 17.9688Z" fill="currentColor"/>
                                            <path d="M4.06875 17.9688C3.86875 17.9688 3.66874 17.8688 3.46874 17.7688C2.96874 17.4688 2.86875 16.8688 3.16875 16.3688L6.76874 10.9688L3.16875 5.56876C2.86875 5.06876 2.96874 4.46873 3.46874 4.16873C3.96874 3.86873 4.56875 3.96878 4.86875 4.46878L8.86875 10.4688C9.06875 10.7688 9.06875 11.2688 8.86875 11.5688L4.86875 17.5688C4.66875 17.7688 4.36875 17.9688 4.06875 17.9688Z" fill="currentColor"/>
                                        </svg>
                                    </span>
                                    <!--end::Svg Icon-->
                                </button>
                                <button title="Takeprofit" class="btn btn-icon btn-sm btn-light-${full.isTakeProfit === true ? "success" : "danger"}">
                                    <!--begin::Svg Icon | path: assets/media/icons/duotune/abstract/abs035.svg-->
                                    <span class="svg-icon svg-icon-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M22 7H2V11H22V7Z" fill="currentColor"/>
                                            <path opacity="0.3" d="M21 19H3C2.4 19 2 18.6 2 18V6C2 5.4 2.4 5 3 5H21C21.6 5 22 5.4 22 6V18C22 18.6 21.6 19 21 19ZM14 14C14 13.4 13.6 13 13 13H5C4.4 13 4 13.4 4 14C4 14.6 4.4 15 5 15H13C13.6 15 14 14.6 14 14ZM16 15.5C16 16.3 16.7 17 17.5 17H18.5C19.3 17 20 16.3 20 15.5C20 14.7 19.3 14 18.5 14H17.5C16.7 14 16 14.7 16 15.5Z" fill="currentColor"/>
                                        </svg>
                                    </span>
                                    <!--end::Svg Icon-->
                                </button>
                                <button title="DCA" class="btn btn-icon btn-sm btn-light-${full.isDca === true ? "success" : "danger"}">
                                    <!--begin::Svg Icon | path: assets/media/icons/duotune/abstract/abs035.svg-->
                                    <span class="svg-icon svg-icon-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path opacity="0.3" d="M9.10001 7.00005L6.2 12H2C2 8.30005 4 5.10005 7 3.30005L9.10001 7.00005ZM17 3.30005L14.9 7.00005L17.8 12H22C22 8.30005 20 5.10005 17 3.30005ZM14.9 17H9.10001L7 20.7C8.5 21.6 10.2 22 12 22C13.8 22 15.5 21.5 17 20.7L14.9 17Z" fill="currentColor"/>
                                            <path d="M17 3.3L14.9 7H9.10001L7 3.3C8.5 2.5 10.2 2 12 2C13.8 2 15.5 2.5 17 3.3ZM17.8 12L14.9 17L17 20.7C20 19 22 15.7 22 12H17.8ZM6.2 12H2C2 15.7 4 18.9 7 20.7L9.10001 17L6.2 12Z" fill="currentColor"/>
                                        </svg>
                                    </span>
                                    <!--end::Svg Icon-->
                                </button>`;
                    })
                }, {
                    title: "Active",
                    dataIndex: "active",
                    keyIndex: "active",
                    filter: true,
                    sorter: true,
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-${data === true ? "success" : "danger"}">${data === true ? "Active" : "Deactive"}</span>`
                    })
                }],
                addData: [{
                    title: "Email",
                    keyIndex: "email",
                    type: "input",
                    required: true
                }, {
                    title: "Api Key",
                    keyIndex: "apiKey",
                    type: "textarea",
                    required: true
                }, {
                    title: "Api Secret",
                    keyIndex: "apiSecret",
                    type: "textarea",
                    required: true
                }, {
                    title: "Vốn",
                    keyIndex: "capital",
                    type: "input",
                    validate: "number",
                    min: "0",
                    value: "0",
                    required: true
                }, {
                    title: "Ngân Sách Mỗi Lệnh",
                    keyIndex: "budget",
                    type: "input",
                    validate: "number",
                    min: "0",
                    value: "10",
                    required: true
                }, {
                    title: "Coins",
                    keyIndex: "coins",
                    type: "select2",
                    dropdown: "kt_modal_add_form",
                    multi: true,
                    defaultValue: coins
                }, {
                    title: "List Coin",
                    keyIndex: "listCoin",
                    type: "textarea",
                    placeholder: "XLMUSDT|XRPUSDT"
                }, {
                    title: "isAuto",
                    keyIndex: "isAuto",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }, {
                    title: "isTakeProfit",
                    keyIndex: "isTakeProfit",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }, {
                    title: "isDca",
                    keyIndex: "isDca",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
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
                    title: "Email",
                    keyIndex: "email",
                    type: "input",
                    required: true
                }, {
                    title: "Api Key",
                    keyIndex: "apiKey",
                    type: "textarea",
                    required: true
                }, {
                    title: "Api Secret",
                    keyIndex: "apiSecret",
                    type: "textarea",
                    required: true
                }, {
                    title: "Vốn",
                    keyIndex: "capital",
                    type: "input",
                    validate: "number",
                    min: "0",
                    value: "0",
                    required: true
                }, {
                    title: "Ngân Sách Mỗi Lệnh",
                    keyIndex: "budget",
                    type: "input",
                    validate: "number",
                    min: "0",
                    value: "10",
                    required: true
                }, {
                    title: "Coins",
                    keyIndex: "coins",
                    type: "select2",
                    dropdown: "kt_modal_edit_form",
                    multi: true,
                    defaultValue: coins
                }, {
                    title: "List Coin",
                    keyIndex: "listCoin",
                    type: "textarea",
                    placeholder: "XLMUSDT|XRPUSDT"
                }, {
                    title: "isAuto",
                    keyIndex: "isAuto",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }, {
                    title: "isTakeProfit",
                    keyIndex: "isTakeProfit",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }, {
                    title: "isDca",
                    keyIndex: "isDca",
                    type: "select2",
                    defaultValue: [{
                        name: "Active",
                        value: "true"
                    }, {
                        name: "Deactive",
                        value: "false"
                    }],
                    required: true
                }, {
                    title: "Active",
                    keyIndex: "active",
                    type: "select2",
                    defaultValue: [{
                        name: "True",
                        value: "true"
                    }, {
                        name: "False",
                        value: "false"
                    }],
                    required: true
                }],
                closeOrderData: [{
                    title: "id",
                    keyIndex: "id",
                    type: "hidden",
                    required: true
                }, {
                    title: "symbol",
                    keyIndex: "symbol",
                    type: "select2",
                    dropdown: "kt_modal_close_order_form",
                    defaultValue: coins.map((item: any) => {
                        return {
                            name: item.name,
                            value: item.name
                        }
                    }),
                    required: true
                }]
            }
        }
    })
}
const add = (req: Request, res: Response, next: NextFunction) => {
    let { email, apiKey, apiSecret, coins, listCoin, capital, budget, isAuto, isTakeProfit, isDca, active } = req.body;
    Binance.count({
        where: {
            email
        }
    }).then((count) => {
        if(count === 0) {
            Binance.create({
                email,
                apiKey,
                apiSecret,
                isAuto,
                capital,
                budget,
                isTakeProfit,
                isDca,
                active,
                UserId: req.session.user.id
            }).then(async(data) => {
                let checkAccount = await checkLive(Number(data.id), req.session.user.id, req.session.user.ugroup);
                let allCoin = await Coin.findAll({
                    where: {
                        active: true,
                        min: {
                            [Op.lte]: Number(budget) // chỉ chọn coin giá min dưới giá budget
                        }
                    },
                    attributes: ["id"],
                    raw: true
                });
                let items = [];
                if(listCoin) {
                    let listCoins = listCoin.split("|");
                    for(const symbol of listCoins) {
                        let check = allCoin.filter((arr) => arr.symbol === symbol);
                        if(check.length > 0) {
                            items.push(check[0].id);
                        }
                    }
                } else {
                    if(Array.isArray(coins)) {
                        for(const item of coins) {
                            let check = allCoin.filter((arr) => arr.id === Number(item));
                            if(check.length > 0) {
                                items.push(Number(item));
                            }
                        }
                    } else {
                        let check = allCoin.filter((arr) => arr.id === Number(coins));
                        if(check.length > 0) {
                            items.push(Number(coins));
                        }
                    }
                }
                let unique = [...new Set(items)];
                await data.addCoins(unique);
                clearCache({
                    type: "all_binance"
                })
                await Binance.update({
                    active: checkAccount.isLive
                }, {
                    where: {
                        id: data.id
                    }
                })
                res.json({
                    status: 1,
                    data,
                    isLive: checkAccount.isLive
                });
            }).catch((err) => {
                Logger.error(err);
                next({
                    status: 500,
                    msg: "Error"
                })
            })
        } else {
            res.json({
                status: 0,
                msg: "Email đã tồn tại"
            })
        }
    }).catch((err) => {
        Logger.error(err);
        res.json({
            status: 0,
            msg: "Đã xảy ra lỗi"
        })
    })
}
const info = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.params;
    let where: any = {
        id
    }
    if(req.session.user.ugroup != "admin") {
        where.UserId = req.session.user.id;
    }
    Binance.findOne({
        where,
        include: [{
            model: Coin
        }]
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
    let { id, email, apiKey, apiSecret, capital, budget, active, coins, listCoin, isAuto, isTakeProfit, isDca } = req.body;
    let allCoin = await Coin.findAll({
        attributes: ["id", "symbol"],
        where: {
            active: true,
            min: {
                [Op.lte]: Number(budget) // chỉ chọn coin giá min dưới giá budget
            }
        },
        raw: true
    });
    let where: any = {
        id
    }
    if(req.session.user.ugroup != "admin") {
        where.UserId = req.session.user.id;
    }
    Binance.update({
        email,
        apiKey,
        apiSecret,
        capital,
        budget,
        isAuto,
        active,
        isTakeProfit,
        isDca
    }, {
        where
    }).then(async() => {
        let removeAllCoins = allCoin.map((coin) => coin.id);
        let binance = await Binance.findByPk(id);
        await binance.removeCoins(removeAllCoins);
        // add Coin
        let items = [];
        if(listCoin) {
            let listCoins = listCoin.split("|");
            for(const symbol of listCoins) {
                let check = allCoin.filter((arr) => arr.symbol === symbol);
                if(check.length > 0) {
                    items.push(check[0].id);
                }
            }
        } else {
            if(Array.isArray(coins)) {
                for(const item of coins) {
                    let check = allCoin.filter((arr) => arr.id === Number(item));
                    if(check.length > 0) {
                        items.push(Number(item));
                    }
                }
            } else {
                let check = allCoin.filter((arr) => arr.id === Number(coins));
                if(check.length > 0) {
                    items.push(Number(coins));
                }
            }
        }
        let unique = [...new Set(items)];
        await binance.addCoins(unique);
        clearCache({
            type: "all_binance"
        })
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
const del = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    Binance.destroy({
        where: {
            id,
            UserId: req.session.user.id
        }
    }).then(() => {
        clearCache({
            type: "all_binance"
        })
        res.json({
            status: 1
        })
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const ajax = (req: Request, res: Response, next: NextFunction) => {
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
    const prm = [];
    prm.push(Binance.count({
        where: info.where
    }));
    prm.push(Binance.findAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order,
        include: [{
            model: Coin
        }, {
            model: User
        }]
    }));
    Promise.all(prm).then(async(values: any) => {
        let data = values[1];
        let total = values[0];
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
const check = async(req: Request, res: Response, next: NextFunction) => {
    let id = req.params.id;
    let checkAccount = await checkLive(Number(id), req.session.user.id, req.session.user.ugroup);
    await Binance.update({
        active: checkAccount.isLive
    }, {
        where: {
            id,
            UserId: req.session.user.id
        }
    })
    res.json({
        status: 1,
        isLive: checkAccount.isLive,
        email: checkAccount.email
    })
}
const checkLive = (id: number, UserId: number, ugroup: "admin" | "member"): Promise<{
    email: string,
    isLive: boolean
}> => {
    return new Promise((resolve, reject) => {
        let where: any = {
            id
        };
        if(ugroup != "admin") {
            where = {
                id,
                UserId
            }
        }
        Binance.findOne({
            where
        }).then(async (account) => {
            if (account != null) {
                let binance = BinanceApi({
                    apiKey: account.apiKey,
                    apiSecret: account.apiSecret,
                    getTime
                });
                binance.futuresAccountInfo({
                    recvWindow: 10000
                }).then(() => {
                    resolve({
                        email: account.email,
                        isLive: true
                    });
                }).catch(() => {
                    resolve({
                        email: account.email,
                        isLive: false
                    });
                });
            } else {
                resolve({
                    email: account.email,
                    isLive: false
                });
            }
        }).catch(() => resolve({
            email: "notfound",
            isLive: false
        }));
    })
}
const closeAll = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    if(id) {
        let where: any = {
            id
        }
        if(req.session.user.ugroup != "admin") {
            where = {
                id,
                UserId: req.session.user.id
            }
        }
        Binance.findOne({
            where
        }).then(async (account) => {
            if (account != null) {
                let binance = BinanceApi({
                    apiKey: account.apiKey,
                    apiSecret: account.apiSecret,
                    getTime
                });
                binance.futuresPositionRisk({
                    recvWindow: 10000
                }).then(async(orders) => {
                    let filters = orders.filter((item) => item.entryPrice != "0.0");
                    let coins = groupByKey(filters, "symbol");
                    for (const symbol in coins) {
                        let items = coins[symbol];
                        await closeOrder(account, symbol, items);
                    }
                    await closeAllOrder(id);
                    await OrderTrailing.destroy({
                        where: {
                            BinanceId: id
                        }
                    });
                    await OrderMarket.destroy({
                        where: {
                            BinanceId: id
                        }
                    })
                    res.json({
                        status: 1,
                        msg: "Close all lệnh thành công"
                    });
                }).catch((err) => {
                    Logger.error(err);
                    res.json({
                        status: 0,
                        msg: "Đã xảy ra lỗi"
                    })
                });
            } else {
                next({
                    status: 500,
                    msg: "Không tìm thấy tài khoản"
                })
            }
        }).catch((err) => {
            Logger.error(err);
            next({
                status: 500,
                msg: "Đã xảy ra lỗi"
            })
        });
    } else {
        next({
            status: 500,
            msg: "Thiếu dữ liệu"
        })
    }
}
const closeOrderRequest = (req: Request, res: Response, next: NextFunction) => {
    let { id, symbol } = req.body;
    if(id && symbol) {
        let where: any = {
            id
        }
        if(req.session.user.ugroup != "admin") {
            where = {
                id,
                UserId: req.session.user.id
            }
        }
        Binance.findOne({
            where
        }).then(async (account) => {
            if (account != null) {
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
                    res.json({
                        status: 1,
                        msg: `Close order ${symbol} thành công`
                    });
                }).catch((err) => {
                    Logger.error(err);
                    res.json({
                        status: 0,
                        msg: "Đã xảy ra lỗi"
                    })
                });
            } else {
                next({
                    status: 500,
                    msg: "Không tìm thấy tài khoản"
                })
            }
        }).catch((err) => {
            Logger.error(err);
            next({
                status: 500,
                msg: "Đã xảy ra lỗi"
            })
        });
    } else {
        next({
            status: 500,
            msg: "Thiếu dữ liệu"
        })
    }
}
const closeAllOrder = (id: number) => {
    return new Promise(async(resolve, reject) => {
        let account = await Binance.findOne({
            where: {
                id,
                active: true
            },
            raw: true
        }).catch(() => null);
        if(account) {
            let binance = BinanceApi({
                apiKey: account.apiKey,
                apiSecret: account.apiSecret,
                getTime
            });
            let all = await binance.futuresOpenOrders({
                useServerTime: true
            });
            let coins = groupByKey(all, "symbol");
            for(const symbol in coins) {
                await OrderTrailing.destroy({
                    where: {
                        symbol,
                        BinanceId: id
                    }
                })
                await OrderMarket.destroy({
                    where: {
                        BinanceId: id
                    }
                })
                await binance.futuresCancelAllOpenOrders({
                    symbol
                });
            }
            resolve("OK");
        } else {
            reject("Không tìm thấy tài khoản")
        }
    })
}
const getBalance = async(req: Request, res: Response, next: NextFunction) => {
    let where: any = {
        active: true
    }
    if(req.session.user.ugroup != "admin") {
        where = {
            UserId: req.session.user.id,
            active: true
        }
    }
    let accounts = await Binance.findAll({
        where
    });
    let data = [];
    for(const account of accounts) {
        let info = account.get({
            plain: true
        })
        let binance = BinanceApi({
            apiKey: info.apiKey,
            apiSecret: info.apiSecret,
            getTime
        });
        try {
            let balances = await binance.futuresAccountBalance({
                recvWindow: 10000
            });
            // let position = await binance.futuresPositionRisk({
            //     recvWindow: 10000
            // }).then((array) => {
            //     array = array.filter((arr: any) => arr.entryPrice != "0.0");
            //     return array;
            // }).catch(() => []);
            let crossUnPnl = 0;
            let balance: any = balances.filter((item: any) => item.asset === "USDT");
            if(balance.length > 0) {
                crossUnPnl = Number(balance[0].crossUnPnl);
                balance = Number(balance[0].balance);
            } else {
                crossUnPnl = Number(balances[0].crossUnPnl);
                balance = balances[0].balance;
            }
            // let pnl = {
            //     long: 0,
            //     short: 0
            // }
            // for(const item of position) {
            //     if(Number(item.positionAmt) > 0) {
            //         pnl.long += Number(item.unRealizedProfit);
            //     } else {
            //         pnl.short += Number(item.unRealizedProfit);
            //     }
            // }
            data.push({
                id: account.id,
                email: account.email,
                balance: balance.toFixed(4),
                crossUnPnl: crossUnPnl.toFixed(4),
                // pnl: {
                //     long: pnl.long.toFixed(4),
                //     short: pnl.short.toFixed(4)
                // }
            })
        } catch(ex) {
            // console.error(ex);
        }
    }
    res.json({
        status: 1,
        data
    })
}
export {
    list,
    add,
    info,
    edit,
    del,
    ajax,
    check,
    closeAll,
    closeOrderRequest,
    getBalance
}
export default {
    list,
    add,
    info,
    edit,
    del,
    ajax,
    check,
    closeAll,
    closeOrderRequest,
    getBalance
}