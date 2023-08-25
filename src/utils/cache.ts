import CryptoJS from "crypto-js";
import redis from "../redis";
import dotenv from "dotenv";
dotenv.config();
const REDIS_KEY = process.env.REDIS_KEY;
interface IRedisKey {
    type: "all_setting" | "all_binance" | "all_symbol" | "volume" | "charts",
    coin?: string,
    url?: string
}
const generateKey = (config: IRedisKey) => {
    let {
        type,
        coin,
        url
    } = config;
    switch(type) {
        case "volume":
            return `${REDIS_KEY}_volume:${coin}`;
        case "charts":
            return `${REDIS_KEY}_charts:${CryptoJS.MD5(url).toString()}`;
        default:
            return `${REDIS_KEY}_${type}`;
    }
}
const clearCache = (config: IRedisKey) => {
    let key = generateKey(config);
    return redis.del(key);
}
export {
    generateKey,
    clearCache
}
export default {
    generateKey,
    clearCache
}