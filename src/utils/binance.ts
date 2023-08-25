import BinanceApi, { NewFuturesOrder, PositionRiskResult } from "binance-api-node";
import { Binance, OrderTrailing, OrderMarket, Profit } from "../sequelize";
import { BinanceAttributes } from "../models/binance.model";
import { CoinAttributes } from "../models/coin.model";
import axios, { AxiosResponse } from "axios";
import getSetting from "./setting";
import { sleep, timenow } from "./";
import Logger from "../helpers/logger";
import moment from "moment";
import { IAllCoinChart, IItemPosition } from "../typings/binance";
const NUMORDER = 18;
const MARGIN = 20;
const maxCommand = 4;
const getPrice = (symbol: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        axios.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`).then((response) => {
            let json: any = response.data;
            resolve(Number(json.lastPrice));
        }).catch((err) => {
            resolve(0);
        });
    })
}
const openOrder = (account: BinanceAttributes, options: NewFuturesOrder) => {
    return new Promise(async(resolve, reject) => {
        let client = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        client.futuresOrder({
            ...options
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}
const closeOrder = (account: BinanceAttributes, symbol: string, items: PositionRiskResult[]) => {
    return new Promise(async(resolve, reject) => {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        let margin = 0, PNL = 0, isError = false;
        for (const item of items) {
            margin += Number(Math.abs(Number(item.notional)) / Number(item.leverage));
            PNL += Number(item.unRealizedProfit);
        }
        margin = Number(margin.toFixed(4));
        let PNLPercent = Number((PNL * 100 / margin).toFixed(2));
        //
        let content: any = [];
        for (const item of items) {
            await OrderTrailing.destroy({
                where: {
                    symbol,
                    BinanceId: account.id
                }
            });
            await OrderMarket.destroy({
                where: {
                    symbol,
                    BinanceId: account.id
                }
            });
            await openOrder(account, {
                type: "MARKET",
                positionSide: item.positionSide === "LONG" ? "LONG" : "SHORT",
                symbol,
                side: item.positionSide === "LONG" ? "SELL" : "BUY",
                newOrderRespType: "RESULT",
                quantity: Math.abs(Number(item.positionAmt)).toString()
            }).then(() => {
                let marginPercent = Number(Math.abs(Number(item.notional)) / Number(item.leverage));
                let percent = Number((Number(item.unRealizedProfit) * 100 / marginPercent).toFixed(2));
                content.push({
                    positionSide: item.positionSide,
                    percent,
                    margin: marginPercent,
                    unRealizedProfit: Number(item.unRealizedProfit).toFixed(3)
                })
            }).catch((err) => {
                Logger.error(`Take Profit Error: `, err);
                isError = true;
            });
        }
        if(!isError) {
            await Profit.create({
                symbol,
                UserId: account.UserId,
                BinanceId: account.id,
                margin: Number(margin.toFixed(3)),
                pnl: Number(PNL.toFixed(3)),
                pnlPercent: PNLPercent,
                position: items.length,
                content: JSON.stringify(content)
            }).catch(() => null);
            Logger.info(`Take Profit Success: ${symbol} (${PNLPercent}%|${Number(PNL).toFixed(3)} USDT)`);
            // clear all lệnh chờ của coin đó
            await binance.futuresCancelAllOpenOrders({
                symbol
            });
            resolve("OK");
        } else {
            reject("Error");
        }
    })
}
const closeOneOrder = (account: BinanceAttributes, symbol: string, item: PositionRiskResult) => {
    return new Promise(async(resolve, reject) => {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        let isError = false;
        let margin = Number(Number(Math.abs(Number(item.notional)) / Number(item.leverage)).toFixed(4));
        let PNL = Number(item.unRealizedProfit);
        let PNLPercent = Number((PNL * 100 / margin).toFixed(2));
        let content: any = [];
        if(PNL > 0) {
            // chỉ close khi có lãi
            await openOrder(account, {
                type: "MARKET",
                positionSide: item.positionSide === "LONG" ? "LONG" : "SHORT",
                symbol,
                side: item.positionSide === "LONG" ? "SELL" : "BUY",
                newOrderRespType: "RESULT",
                quantity: Math.abs(Number(item.positionAmt)).toString()
            }).then(() => {
                let marginPercent = Number(Math.abs(Number(item.notional)) / Number(item.leverage));
                let percent = Number((Number(item.unRealizedProfit) * 100 / marginPercent).toFixed(2));
                content.push({
                    positionSide: item.positionSide,
                    percent,
                    margin: marginPercent,
                    unRealizedProfit: Number(item.unRealizedProfit).toFixed(3)
                })
            }).catch((err) => {
                Logger.error(`Take Profit Error: `, err);
                isError = true;
            });
            if(!isError) {
                await OrderTrailing.destroy({
                    where: {
                        symbol,
                        BinanceId: account.id
                    }
                });
                await OrderMarket.destroy({
                    where: {
                        symbol,
                        BinanceId: account.id
                    }
                });
                await Profit.create({
                    symbol,
                    UserId: account.UserId,
                    BinanceId: account.id,
                    margin: Number(margin.toFixed(3)),
                    pnl: Number(PNL.toFixed(3)),
                    pnlPercent: PNLPercent,
                    position: 1,
                    content: JSON.stringify(content)
                }).catch(() => null);
                Logger.info(`Take Profit Success: ${symbol} (${PNLPercent}%|${Number(PNL).toFixed(3)} USDT)`);
                // clear all lệnh chờ của coin đó
                await binance.futuresCancelAllOpenOrders({
                    symbol
                });
                resolve("OK");
            } else {
                reject("Error");
            }
        } else {
            reject("PNL thấp hơn 0")
        }
        
    })
}
const getTime = (): Promise<number> => {
    return new Promise(async(resolve, reject) => {
        axios.get("https://api.binance.com/api/v3/time").then((response) => {
            let json: any = response.data;
            resolve(json.serverTime);
        }).catch(() => {
            resolve(Date.now());
        });
    })
}
const isOpenOrder = (account: BinanceAttributes, symbol: string): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        try {
            let binance = BinanceApi({
                apiKey: account.apiKey,
                apiSecret: account.apiSecret,
                getTime
            });
            let data = await binance.futuresOpenOrders({
                symbol,
                useServerTime: true
            });
            let orders =  await binance.futuresPositionRisk();
            let filters = orders.filter((item: any) => item.entryPrice != "0.0" && item.symbol == symbol);
            if(JSON.stringify(data).includes("code")) {
                reject("Error");
            } else {
                if(data.length > 0 || filters.length > 0) resolve(false);
                resolve(true);
            }
        } catch(ex) {
            Logger.error(ex);
            reject(ex);
        }
    })
}
const getAllCoinChart = (): Promise<IAllCoinChart[]> => {
    return new Promise((resolve, reject) => {
        axios.get(`https://api.binance.com/api/v3/ticker/price`).then((response: AxiosResponse<IAllCoinChart[]>) => {
            resolve(response.data);
        }).catch((err) => {
            resolve([])
        });
    })
}
export {
    openOrder,
    getPrice,
    closeOrder,
    closeOneOrder,
    isOpenOrder,
    getTime,
    getAllCoinChart
}
export default {
    openOrder,
    getPrice,
    closeOrder,
    closeOneOrder,
    isOpenOrder,
    getTime,
    getAllCoinChart
}