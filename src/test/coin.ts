import { Coin } from "../sequelize";
(async() => {
    // let str = "BAKEUSDT|SXPUSDT|XRPUSDT|IOTAUSDT|ICXUSDT|C98USDT|MANAUSDT|SFPUSDT|FLMUSDT|TLMUSDT|CHZUSDT|BTSUSDT|XLMUSDT|THETAUSDT|KAVAUSDT|GRTUSDT|MTLUSDT|CHRUSDT|SRMUSDT|SUSHIUSDT|BANDUSDT|ONTUSDT|QTUMUSDT|SNXUSDT|1INCHUSDT|OGNUSDT|KEEPUSDT|KLAYUSDT|CTSIUSDT|TOMOUSDT|KNCUSDT|ARPAUSDT|IOTXUSDT|ONEUSDT|BLZUSDT|SKLUSDT|OCEANUSDT|ZILUSDT|RENUSDT|CTKUSDT|CELRUSDT|ALGOUSDT|AUDIOUSDT|RLCUSDT|OMGUSDT|RUNEUSDT|RAYUSDT|LITUSDT|DODOUSDT|NKNUSDT|LRCUSDT|LINAUSDT|RVNUSDT|CVCUSDT|COTIUSDT|HBARUSDT|ADAUSDT|TRXUSDT|AKROUSDT|ALPHAUSDT|SANDUSDT|GALAUSDT|STMXUSDT|ENJUSDT|BELUSDT|XEMUSDT|BATUSDT|NUUSDT|STORJUSDT|ZRXUSDT|ATAUSDT|HOTUSDT|XTZUSDT|1000XECUSDT";
    let allCoin = await Coin.findAll({
        where: {
            active: true
        },
        raw: true
    });
    let str = "";
    for(const item of allCoin) {
        str += `${item.symbol}|`;
    }
    console.log(str);
})();