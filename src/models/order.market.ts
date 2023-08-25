import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
import Binance from "./binance.model";
import User from "./user.model";
export interface OrderMarketAttributes {
    id?: number;
    stt?: number;
    symbol?: string;
    positionSide?: "LONG" | "SHORT";
    markPrice?: number;
    status?: "processing" | "filled" | "error";
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    BinanceId?: number;
    readonly Binance?: Binance;
    UserId?: number;
    readonly User?: User;
}
interface OrderMarketCreationAttributes extends Optional<OrderMarketAttributes, "id"> {}
export class OrderMarket extends Model<OrderMarketAttributes, OrderMarketCreationAttributes> implements OrderMarketAttributes {
    public id?: number;
    public stt?: number;
    public symbol?: string;
    public positionSide?: "LONG" | "SHORT";
    public markPrice?: number;
    public status?: "processing" | "filled" | "error";
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
    public BinanceId?: number;
    public readonly Binance?: Binance;
    public UserId?: number;
    public readonly User?: User;
}
OrderMarket.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    stt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false
    },
    positionSide: {
        type: DataTypes.ENUM("LONG", "SHORT"),
        allowNull: false,
    },
    markPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM("processing", "filled", "error"),
        allowNull: false,
        defaultValue: "processing"
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_order_markets",
    underscored: true,
    indexes: [{
        name: "symbol",
        fields: ["symbol"]
    }, {
        name: "status",
        fields: ["status"]
    }, {
        name: "position_side",
        fields: ["position_side"]
    }]
});
export default OrderMarket;