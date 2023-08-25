import {
    Sequelize
} from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const mysql = {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
};
export const dbConfig = new Sequelize(mysql.database, mysql.username, mysql.password, {
    dialect: "mysql",
    host: mysql.host,
    port: 3306,
    logging: false,
    timezone: '+07:00',
    pool: {
        max: 1000,
        min: 0,
        acquire: 1000000,
        idle: 500000
    }
});
// Init
import User from "./models/user.model";
import Binance from "./models/binance.model";
import Setting from "./models/setting.model";
import Coin from "./models/coin.model";
import Profit from "./models/profit.model";
import OrderTrailing from "./models/order.trailing";
import OrderMarket from "./models/order.market";
import Logs from "./models/logs.model";
// Relationship
User.hasMany(Binance, {
    onDelete: "CASCADE"
});
Binance.belongsTo(User);

Binance.belongsToMany(Coin, {
    through: "binancecoin"
});
Coin.belongsToMany(Binance, {
    through: "binancecoin"
})
// 
User.hasMany(Profit, {
    onDelete: "CASCADE",
    as: "Profit"
});
Profit.belongsTo(User);
Binance.hasMany(Profit, {
    onDelete: "CASCADE",
    as: "Profit"
});
Profit.belongsTo(Binance);
// Open order trailing
User.hasMany(OrderTrailing, {
    onDelete: "CASCADE"
});
OrderTrailing.belongsTo(User);
Binance.hasMany(OrderTrailing, {
    onDelete: "CASCADE"
});
OrderTrailing.belongsTo(Binance);
// Open order market
User.hasMany(OrderMarket, {
    onDelete: "CASCADE"
});
OrderMarket.belongsTo(User);
Binance.hasMany(OrderMarket, {
    onDelete: "CASCADE"
});
OrderMarket.belongsTo(Binance);
// Logs
Binance.hasMany(Logs, {
    onDelete: "CASCADE"
});
Logs.belongsTo(Binance);

export const sync = () => {
    return new Promise((resolve, reject) => {
        dbConfig.sync({
            force: false,
            alter: true
        }).then(() => {
            resolve("OK");
        }).catch((err) => {
            reject(err);
        })
    })
}
export {
    User,
    Binance,
    Setting,
    Coin,
    Profit,
    OrderTrailing,
    OrderMarket,
    Logs
}
export default {
    User,
    Binance,
    Setting,
    Coin,
    Profit,
    OrderTrailing,
    OrderMarket,
    Logs
};