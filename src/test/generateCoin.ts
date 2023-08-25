import { Coin } from "../sequelize";
import { listCoin } from "../controllers/coin.controller";
(async() => {
    let coins = await listCoin();
    for(const item of coins) {
        if(item.name.includes("USDT") && !item.name.includes("_")) {
            if(!item.name.includes("BTC") && !item.name.includes("BNB") && !item.name.includes("ETH")) {
                await Coin.create({
                    symbol: item.name,
                    decimalPrice: 0,
                    decimalSize: 0
                })
            }
        }
    }
    console.log("DONE");
})();