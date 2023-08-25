import BinanceApi, { NewFuturesOrder } from "binance-api-node";
import axios from "axios";
var isMaket = true; // bật lên là sẽ mở lệnh đối xứng
var checkPercent = 70;
var isCloseAll = true;
var isClose = true;
var flag = -900;
var split = 5; //để ý cái này
var shield = false;
var igrone: any = [
    // "FLMUSDT",
    // "TRXUSDT",
    // "HOTUSDT",
    // "RAYUSDT",
    // "BTSUSDT"
]
// var account = {
//     apiKey: "epzOMzSiv7vTL9GPjzVR7dNpUuK3PWiWj2bi9IRypVIp1ffKEkk7zLqw1UbhgkiE",
//     apiSecret: "D34ZmMSUIfFDrDohP11LBquBptkW3R2UUh74UpsQkaCa2stozdQCnjqZRtZCScOM"
// }; // tu
// var account = {
//     apiKey: "kMktRQ6DNaG062mrZEawoXbC0nLFmAGiAueALFWnKIY5sjEjuZn5DPi99eKGDj40",
//     apiSecret: "Sl8eLx5W1F1zsaKuXL6zMjWFqHCOJdAWo61RnTcb0zkUiCP7MPj600ztAwr5BN19"
// }; // nam
var account = {
    apiKey: "fHvbeLDjTAXTpO56XMtGh9nfrHGXqjMdpyiQjVfH2WWNXXmnOkyZwM9pPHWqdllD",
    apiSecret: "KHo0ZizufdXdIqGI2QKhYQ7688zxKLkR5f0NuZAUBA530wa4dcylymylWxp7dsq5"
}; // quangthanh
// function
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
const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const groupByKey = (list: any[], key: string) => list.reduce((hash, obj) => ({...hash, [obj[key]]:( hash[obj[key]] || [] ).concat(obj)}), {})
const openOrder = (account: any, options: NewFuturesOrder) => {
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
const auto = async() => {
    return new Promise(async(resolve, reject) => {
        let binance = BinanceApi({
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            getTime
        });
        let orders = await binance.futuresPositionRisk({
            recvWindow: 10000000
        });
        // console.log(orders.length);
        let filters = orders.filter((item: any) => item.entryPrice != "0.0");
        let coins = groupByKey(filters, "symbol");
        let pnl: {
            LONG: number,
            SHORT: number,
            [type: string]: number
        } = {
            LONG: 0,
            SHORT: 0
        }
        let MARGIN: {
            LONG: number,
            SHORT: number,
            [type: string]: number
        } = {
            LONG: 0,
            SHORT: 0
        }
        for (const symbol in coins) {
            let items = coins[symbol];
            if(items.length === 1) {
                let position = items[0];
                pnl[position.positionSide] += Number(position.unRealizedProfit);
                let margin = Number(Math.abs(Number(position.notional)) / Number(position.leverage));
                MARGIN[position.positionSide] += margin;
                // bắn lệnh ngược chiều để đỡ
                if(isMaket) {
                    // có biến là tắt lệnh tạo liền
                    // if(position.positionSide != "LONG") {
                        await openOrder(account, {
                            side: position.positionSide === "SHORT" ? "BUY" : "SELL",
                            positionSide: position.positionSide === "SHORT" ? "LONG" : "SHORT",
                            symbol: position.symbol,
                            type: "MARKET",
                            quantity: String(Number(Math.abs(Number(position.positionAmt)) / split).toFixed(0))
                        });
                        console.log(`Send ${position.symbol}`);
                        await sleep(1000);
                    // }
                }
            } else {
                for(let position of items) {
                    pnl[position.positionSide] += Number(position.unRealizedProfit);
                    let margin = Number(Math.abs(Number(position.notional)) / Number(position.leverage));
                    let PNL = Number(position.unRealizedProfit);
                    let PNLPercent = Number((PNL * 100 / margin).toFixed(2));
                    MARGIN[position.positionSide] += margin;
                    // đỡ thêm short
                    if(shield) {
                        if(position.positionSide === "SHORT" && !igrone.includes(position.symbol)) {
                            await openOrder(account, {
                                side: "SELL",
                                positionSide: "SHORT",
                                symbol: position.symbol,
                                type: "MARKET",
                                quantity: String(Number(Math.abs(Number(position.positionAmt)) / split).toFixed(0))
                            }).catch(() => null);
                            console.log(`Send ${position.symbol}: ${position.positionSide}`);
                        }
                    }
                    if(PNLPercent > checkPercent) {
                        
                        // close lệnh lãi
                        // let checkClose = false;
                        // if(isClose) {
                        //     if(isCloseAll) {
                        //         await openOrder(account, {
                        //             side: position.positionSide === "LONG" ? "SELL" : "BUY",
                        //             positionSide: position.positionSide === "LONG" ? "LONG" : "SHORT",
                        //             symbol: position.symbol,
                        //             type: "MARKET",
                        //             quantity: String(Math.abs(Number(position.positionAmt)))
                        //         });
                        //         checkClose = true;
                        //         console.log(`Takeprofit ${position.symbol} (PNL: ${PNL} - ${PNLPercent}%)`);
                        //     } else {
                        //         // chỉ close long
                        //         if(position.positionSide === "LONG") {
                        //             await openOrder(account, {
                        //                 side: position.positionSide === "LONG" ? "SELL" : "BUY",
                        //                 positionSide: position.positionSide === "LONG" ? "LONG" : "SHORT",
                        //                 symbol: position.symbol,
                        //                 type: "MARKET",
                        //                 quantity: String(Math.abs(Number(position.positionAmt)))
                        //             });
                        //             checkClose = true;
                        //             console.log(`Takeprofit ${position.symbol} (PNL: ${PNL} - ${PNLPercent}%)`);
                        //         }
                        //     }
                        // }
                        // await sleep(1000);
                        // if(checkClose) {
                        //     if(isMaket) {
                        //         // có biến là tắt lệnh tạo liền
                        //         if(position.positionSide != "LONG") {
                        //             await openOrder(account, {
                        //                 side: position.positionSide === "SHORT" ? "SELL" : "BUY",
                        //                 positionSide: position.positionSide === "SHORT" ? "SHORT" : "LONG",
                        //                 symbol: position.symbol,
                        //                 type: "MARKET",
                        //                 quantity: String(Math.abs(Number(position.positionAmt)))
                        //             });
                        //             console.log(`Send ${position.symbol}`);
                        //         }
                        //     }
                        // }
                    }
                }
            }
            // break;
        }
        if(isMaket) {
            // nếu isMarket đã bật thì tắt đi
            isMaket = false;
        }
        if(shield) {
            // nếu isMarket đã bật thì tắt đi
            shield = false;
        }
        // if(pnl.SHORT > flag) {
        //     isMaket = true;
        // }
        console.log(`PNL: ${pnl.LONG + pnl.SHORT}`);
        console.log("PNL", pnl);
        console.log("MARGIN", MARGIN);
        console.log("======================================");
        resolve("OK");
    })
}
(async() => {
    // while(true) {
    //     await auto();
    //     await sleep(30000);
    // }
    await auto();
})();