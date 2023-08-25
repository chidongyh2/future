import BinanceApi, { PositionRiskResult } from "binance-api-node";
import { IAllCoinChart } from "./typings/binance";
import { groupByKey, sleep } from "./utils";
import { closeOneOrder, getAllCoinChart, getPrice, openOrder, getTime } from "./utils/binance";
import { getSetting } from "./utils/setting";
import { Binance, Logs, OrderTrailing, OrderMarket, Coin } from "./sequelize";
import Logger from "./helpers/logger";
import { CoinAttributes } from "./models/coin.model";
import { OrderTrailingAttributes } from "./models/order.trailing";
import { OrderMarketAttributes } from "./models/order.market";
import { BinanceAttributes } from "./models/binance.model";
import { EGetPositions, IGetPositions } from "./typings/binance.auto";
import { Op } from "sequelize";
interface IHasOrder {
    symbol: string,
    type: "trailing" | "market",
    action: "open" | "dca" | "close" | "all";
    AccountId: number
}
const isHasOrder = (options: IHasOrder): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        let {
            symbol,
            type,
            action,
            AccountId
        } = options;
        let count = 0;
        if(type === "trailing") {
            let where: any = {
                BinanceId: AccountId,
                symbol,
                status: "processing"
            }
            if(action != "all") where.action = action;
            count = await OrderTrailing.count({
                where
            });
        } else {
            count = await OrderMarket.count({
                where: {
                    BinanceId: AccountId,
                    symbol,
                    status: "processing"
                }
            });
        }
        if(count > 0) resolve(true);
        else resolve(false);
    })
}
const getQuantity = (budget: number, coin: CoinAttributes, DISTANCE_SIZE?: number) => {
    return new Promise(async(resolve, reject) => {
        try {
            let activationPrice = await getPrice(coin.symbol);
            // let quantity = Number((((budget * MARGIN) / (LIMIT * 2 * 2)) / activationPrice).toFixed(coins.decimalSize));
            let quantity = Number(((budget) / activationPrice).toFixed(coin.decimalSize));
            if(DISTANCE_SIZE) {
                quantity = Number((quantity / 100 * DISTANCE_SIZE).toFixed(coin.decimalSize));
            }
            resolve(quantity);
        } catch(ex) {
            reject("Error");
        }
    })
}
const getPositions = (account: BinanceAttributes): Promise<{
    [symbol: string]: PositionRiskResult[]
}> => {
    return new Promise((resolve, reject) => {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        binance.futuresPositionRisk().then((orders) => {
            let filters = orders.filter((item: any) => item.entryPrice != "0.0");
            let positions = groupByKey(filters, "symbol");
            // let positions = filters;
            resolve(positions);
        }).catch((err) => {
            reject(err);
        });
    })
}
const getPNLPercent = (options: IGetPositions): EGetPositions => {
    let {
        positions,
        symbol
    } = options;
    try {
        let items = positions[symbol];
        for(const position of items) {
            let margin = Number(Number(Math.abs(Number(position.notional)) / Number(position.leverage)).toFixed(4));
            let PNL = Number(position.unRealizedProfit);
            let PNLPercent = Number((PNL * 100 / margin).toFixed(2));
            return {
                margin,
                PNL,
                PNLPercent
            }
        }
    } catch(ex) {
        return {}
    }
}
interface IGetMarkPercent {
    markPrice: number,
    activationPrice: number,
    price: number
}
interface EGetMarkPercent {
    markPercent: number,
    percent: number
}
const calculatePercent = (first: number, later: number): number => {
    return Number(((later - first) / first * 100).toFixed(2));
}
const getMarkPercent = (options: IGetMarkPercent): EGetMarkPercent => {
    let {
        markPrice,
        activationPrice,
        price
    } = options;
    let markPercent = Math.abs(calculatePercent(activationPrice, markPrice)); // tăng giảm bn % với giá gốc
    let percent = Math.abs(calculatePercent(markPrice, price)); // giá quay đầu lại bn % với giá mark
    return {
        markPercent,
        percent
    }
}
const getChart = (charts: IAllCoinChart[], symbol: string) => {
    let filter = charts.filter((arr) => arr.symbol === symbol);
    if(filter.length > 0) return filter[0];
    return null;
}
interface ICheckOrder {
    chart: IAllCoinChart,
    order: OrderTrailingAttributes,
    account: BinanceAttributes,
    coin?: CoinAttributes,
    position?: PositionRiskResult,
    isDca?: boolean
}
const checkOpenOrder = (options: ICheckOrder): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        const MARK_PERCENT_OPEN = Number(await getSetting("MARK_PERCENT_OPEN"));
        const CALLBACK_RATE_OPEN = Number(await getSetting("CALLBACK_RATE_OPEN"));
        const DCA = Number(await getSetting("DCA"));
        let {
            chart,
            order,
            account,
            coin,
            isDca
        } = options;
        let price = Number(chart.price);
        if(order.markPrice === 0) order.markPrice = price;
        let isOpenOrder = false;
        if(order.positionSide === "LONG") {
            // Open long (Giá càng thấp thì càng long, price phải bé hơn activation)
            if(price < order.activationPrice) {
                let markPrice = order.markPrice; // giá thấp nhất
                if(markPrice > price) markPrice = price;
                let getPercent = getMarkPercent({
                    activationPrice: order.activationPrice,
                    markPrice,
                    price
                });
                let markPercent = getPercent.markPercent;
                let percent = getPercent.percent;
                await OrderTrailing.update({
                    price,
                    markPrice,
                    markPercent
                }, {
                    where: {
                        id: order.id
                    }
                })
                if(markPercent >= MARK_PERCENT_OPEN) {
                    if(percent >= CALLBACK_RATE_OPEN) {
                        if(isDca) {
                            if(order.action === "dca") {
                                let positions = await getPositions(account)
                                    .catch(() => null); // get toàn bộ vị thế trước đó
                                if(positions) {
                                    let info = getPNLPercent({
                                        positions,
                                        symbol: order.symbol
                                    });
                                    if(info.hasOwnProperty("PNL")) {
                                        if(info.PNLPercent < DCA) {
                                            isOpenOrder = true;
                                            await Logs.create({
                                                BinanceId: account.id,
                                                symbol: order.symbol,
                                                markPercent,
                                                price,
                                                type: "dca"
                                            })
                                        }
                                    }
                                }
                            }
                        }
                        if(order.action === "open") {
                            isOpenOrder = true;
                            await Logs.create({
                                BinanceId: account.id,
                                symbol: order.symbol,
                                markPercent,
                                price,
                                type: "open"
                            })
                        }
                        if(isOpenOrder) {
                            Logger.info(`Open ${order.positionSide} ${order.symbol}: ${account.email} (DOWN ${markPercent}%)`);
                        }
                    }
                }
            }
        } else {
            // Open short (Giá càng cao thì càng short, price phải lớn hơn activation)
            if(price > order.activationPrice) {
                let markPrice = order.markPrice; // giá cao nhất
                if(markPrice < price) markPrice = price;
                let getPercent = getMarkPercent({
                    activationPrice: order.activationPrice,
                    markPrice,
                    price
                });
                let markPercent = getPercent.markPercent;
                let percent = getPercent.percent;
                await OrderTrailing.update({
                    price,
                    markPrice,
                    markPercent
                }, {
                    where: {
                        id: order.id
                    }
                })
                if(markPercent >= MARK_PERCENT_OPEN) {
                    if(percent >= CALLBACK_RATE_OPEN) {
                        if(isDca) {
                            if(order.action === "dca") {
                                let positions = await getPositions(account)
                                    .catch(() => null); // get toàn bộ vị thế trước đó
                                if(positions) {
                                    let info = getPNLPercent({
                                        positions,
                                        symbol: order.symbol
                                    });
                                    if(info.hasOwnProperty("PNL")) {
                                        if(info.PNLPercent < DCA) {
                                            isOpenOrder = true;
                                            await Logs.create({
                                                BinanceId: account.id,
                                                symbol: order.symbol,
                                                markPercent,
                                                price,
                                                type: "dca"
                                            })
                                        }
                                    }
                                }
                            }
                        }
                        if(order.action === "open") {
                            isOpenOrder = true;
                            await Logs.create({
                                BinanceId: account.id,
                                symbol: order.symbol,
                                markPercent,
                                price,
                                type: "open"
                            })
                        }
                        if(isOpenOrder) {
                            Logger.info(`Open ${order.positionSide} ${order.symbol}: ${account.email} (UP ${markPercent}%)`);
                        }
                    }
                }
            }
        }
        if(isOpenOrder) {
            // open lệnh
            try {
                let quantity = await getQuantity(account.budget, coin);
                let checkMarket = await openOrder(account, {
                    positionSide: order.positionSide,
                    side: order.positionSide === "LONG" ? "BUY" : "SELL",
                    symbol: order.symbol,
                    type: "MARKET",
                    quantity: String(quantity),
                    recvWindow: 10000
                }).then(() => true).catch((err) => {
                    Logger.error(err);
                    return false;
                });
                if(checkMarket) {
                    await OrderTrailing.update({
                        price,
                        status: "filled"
                    }, {
                        where: {
                            id: order.id
                        }
                    }).catch(() => null);
                    // xóa lệnh ngược lại và khởi tạo lệnh close và lệnh DCA
                    await OrderTrailing.destroy({
                        where: {
                            symbol: order.symbol,
                            BinanceId: order.BinanceId,
                            status: "processing",
                            positionSide: order.positionSide === "LONG" ? "SHORT" : "LONG",
                            action: "open"
                        }
                    }).catch(() => null);
                    await OrderTrailing.destroy({
                        where: {
                            symbol: order.symbol,
                            BinanceId: order.BinanceId,
                            status: "processing",
                            positionSide: order.positionSide === "LONG" ? "LONG" : "SHORT",
                            action: "close"
                        }
                    }).catch(() => null);
                    // khởi tạo lệnh dca
                    await OrderTrailing.create({
                        symbol: order.symbol,
                        BinanceId: order.BinanceId,
                        status: "processing",
                        positionSide: order.positionSide === "LONG" ? "LONG" : "SHORT",
                        action: "dca",
                        activationPrice: price,
                        UserId: account.UserId
                    }).catch(() => null);
                    try {
                        // khởi tạo lệnh close
                        let positions = await getPositions(account)
                            .catch(() => null); // get toàn bộ vị thế trước đó
                        let position = positions[order.symbol];
                        if(position) {
                            let filter = position.filter((arr: any) => arr.positionSide === order.positionSide);
                            if(filter.length > 0) {
                                await OrderTrailing.create({
                                    symbol: order.symbol,
                                    BinanceId: order.BinanceId,
                                    status: "processing",
                                    positionSide: order.positionSide === "LONG" ? "LONG" : "SHORT",
                                    action: "close",
                                    activationPrice: Number(Number(filter[0].entryPrice).toFixed(coin.decimalPrice)),
                                    UserId: account.UserId
                                }).catch(() => null);
                            }
                        }
                    } catch(ex) {
                        console.error(ex);
                    }
                } else {
                    await OrderTrailing.update({
                        price,
                        status: "error"
                    }, {
                        where: {
                            id: order.id
                        }
                    }).catch(() => null);
                }
            } catch(ex) {
                console.error(ex);
            }
        }
        resolve(isOpenOrder);
    })
}
const checkCloseOrder = (options: ICheckOrder): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        const MARK_PERCENT_CLOSE = Number(await getSetting("MARK_PERCENT_CLOSE"));
        const CALLBACK_RATE_CLOSE = Number(await getSetting("CALLBACK_RATE_CLOSE"));
        let {
            chart,
            order,
            account,
            position
        } = options;
        let price = Number(chart.price);
        if(order.markPrice === 0) order.markPrice = price;
        let isCloseOrder = false;
        if(order.positionSide === "LONG") {
            // Close long (Giá càng cao thì càng close long, price phải lớn hơn activation)
            if(price > order.activationPrice) {
                let markPrice = order.markPrice; // giá cao nhất
                if(markPrice < price) markPrice = price;
                let getPercent = getMarkPercent({
                    activationPrice: order.activationPrice,
                    markPrice,
                    price
                });
                let markPercent = getPercent.markPercent;
                let percent = getPercent.percent;
                await OrderTrailing.update({
                    price,
                    markPrice,
                    markPercent
                }, {
                    where: {
                        id: order.id
                    }
                })
                if(markPercent >= MARK_PERCENT_CLOSE) {
                    if(percent >= CALLBACK_RATE_CLOSE) {
                        isCloseOrder = true;
                        Logger.info(`Close ${order.positionSide} ${order.symbol}: ${account.email} (UP ${markPercent}%)`);
                        await Logs.create({
                            BinanceId: account.id,
                            symbol: order.symbol,
                            markPercent,
                            price,
                            type: "close"
                        })
                    }
                }
            }
        } else {
            // Close short (Giá càng thấp thì càng close short, price phải bé hơn activation)
            if(price < order.activationPrice) {
                let markPrice = order.markPrice; // giá thấp nhất
                if(markPrice > price) markPrice = price;
                let getPercent = getMarkPercent({
                    activationPrice: order.activationPrice,
                    markPrice,
                    price
                });
                let markPercent = getPercent.markPercent;
                let percent = getPercent.percent;
                await OrderTrailing.update({
                    price,
                    markPrice,
                    markPercent
                }, {
                    where: {
                        id: order.id
                    }
                })
                if(markPercent >= MARK_PERCENT_CLOSE) {
                    if(percent >= CALLBACK_RATE_CLOSE) {
                        isCloseOrder = true;
                        Logger.info(`Close ${order.positionSide} ${order.symbol}: ${account.email} (DOWN ${markPercent}%)`);
                        await Logs.create({
                            BinanceId: account.id,
                            symbol: order.symbol,
                            markPercent,
                            price,
                            type: "close"
                        })
                    }
                }
            }
        }
        if(isCloseOrder) {
            await OrderTrailing.destroy({
                where: {
                    symbol: order.symbol,
                    BinanceId: account.id
                }
            }).catch(() => null);
            // await Logs.destroy({
            //     where: {
            //         symbol: order.symbol,
            //         BinanceId: account.id
            //     }
            // }).catch(() => null);
            await closeOneOrder(account, order.symbol, position).catch(() => null);
        }
        resolve(isCloseOrder);
    })
}
const calculate = (charts: IAllCoinChart[]) => {
    return new Promise(async(resolve, reject) => {
        // Lấy tất cả tài khoản
        // Logger.info("calculate");
        let accounts = await Binance.findAll({
            where: {
                active: true
            },
            include: [{
                model: Coin
            }]
        }).catch(() => null);
        if(accounts) {
            // get setting
            const CALLBACK_RATE_CLOSE_DISTANCE = Number(await getSetting("CALLBACK_RATE_CLOSE_DISTANCE"));
            const DISTANCE_SHIELD = Number(await getSetting("DISTANCE_SHIELD"));
            const DISTANCE_SIZE = Number(await getSetting("DISTANCE_SIZE"));
            // lấy toàn bộ dữ liệu tài khoản
            for(let rowAccount of accounts) {
                let account = rowAccount.get({
                    plain: true
                });
                try {
                    if(account.isAuto || account.isDca || account.isTakeProfit) {
                        let positions = await getPositions(account)
                            .catch(() => null); // get toàn bộ vị thế trước đó
                        if(account.isAuto || account.isDca) {
                            for(let coin of account.Coins) {
                                if(account.isAuto) {
                                    // kiểm tra từng coin xem đã có lệnh trailing chưa
                                    let check = await isHasOrder({
                                        AccountId: account.id,
                                        action: "all",
                                        symbol: coin.symbol,
                                        type: "trailing"
                                    });
                                    if(!check) {
                                        // nếu không tồn tại order thì khởi tạo order trailing
                                        let activationPrice = await getPrice(coin.symbol);
                                        await OrderTrailing.create({
                                            BinanceId: account.id,
                                            symbol: coin.symbol,
                                            positionSide: "LONG",
                                            stt: 0,
                                            activationPrice,
                                            status: "processing",
                                            action: "open",
                                            UserId: account.UserId
                                        });
                                        await OrderTrailing.create({
                                            BinanceId: account.id,
                                            symbol: coin.symbol,
                                            positionSide: "SHORT",
                                            stt: 0,
                                            activationPrice,
                                            status: "processing",
                                            action: "open",
                                            UserId: account.UserId
                                        });
                                        Logger.info(`Đã tạo 2 open order cho tài khoản ${account.email}: ${coin.symbol}`);
                                    }
                                }
                                // so sánh order
                                let orders = await OrderTrailing.findAll({
                                    where: {
                                        BinanceId: account.id,
                                        status: "processing",
                                        action: {
                                            [Op.in]: ["open", "dca"]
                                        },
                                        symbol: coin.symbol
                                    },
                                    raw: true
                                });
                                for(let order of orders) {
                                    let chart = getChart(charts, coin.symbol);
                                    if(chart) {
                                        // kiểm tra điều kiện và open lệnh
                                        await checkOpenOrder({
                                            chart,
                                            order,
                                            account,
                                            coin,
                                            isDca: account.isDca
                                        });
                                    }
                                }
                            }
                        }
                        if(account.isTakeProfit) {
                            // Chốt lời
                            if(positions) {
                                for(let symbol in positions) {
                                    let position = positions[symbol];
                                    let chart = getChart(charts, symbol);
                                    if(chart) {
                                        for(let item of position) {
                                            let order = await OrderTrailing.findOne({
                                                where: {
                                                    BinanceId: account.id,
                                                    status: "processing",
                                                    action: "close",
                                                    symbol,
                                                    positionSide: item.positionSide
                                                }  
                                            });
                                            if(order) {
                                                let chart = getChart(charts, symbol);
                                                if(chart) {
                                                    await checkCloseOrder({
                                                        account,
                                                        chart,
                                                        order,
                                                        position: item
                                                    })
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch(ex) {
                    Logger.error(ex);
                }
            }
            resolve("OK");
        }
    })
}
(async() => {
    let DELAY = await getSetting("DELAY");
    let charts = await getAllCoinChart();
    await calculate(charts);
    while(1) {
        DELAY = await getSetting("DELAY"); // tự động cập nhật delay
        await sleep(DELAY);
        charts = await getAllCoinChart();
        await calculate(charts);
    }
})();