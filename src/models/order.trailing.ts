import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
import Binance from "./binance.model";
import User from "./user.model";
export interface OrderTrailingAttributes {
    id?: number;
    stt?: number;
    symbol?: string;
    positionSide?: "LONG" | "SHORT";
    activationPrice?: number;
    markPrice?: number;
    markPercent?: number;
    price?: number;
    action?: "open" | "close" | "dca";
    status?: "processing" | "filled" | "error";
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    BinanceId?: number;
    readonly Binance?: Binance;
    UserId?: number;
    readonly User?: User;
}
interface OrderTrailingCreationAttributes extends Optional<OrderTrailingAttributes, "id"> {}
export class OrderTrailing extends Model<OrderTrailingAttributes, OrderTrailingCreationAttributes> implements OrderTrailingAttributes {
    public id?: number;
    public stt?: number;
    public symbol?: string;
    public positionSide?: "LONG" | "SHORT";
    public activationPrice?: number;
    public markPrice?: number;
    public markPercent?: number;
    public price?: number;
    public action?: "open" | "close" | "dca";
    public status?: "processing" | "filled" | "error";
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
    public BinanceId?: number;
    public readonly Binance?: Binance;
    public UserId?: number;
    public readonly User?: User;
}
OrderTrailing.init({
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
    activationPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    markPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    markPercent: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    action: {
        type: DataTypes.ENUM("open", "close", "dca"),
        allowNull: false,
        defaultValue: "open"
    },
    status: {
        type: DataTypes.ENUM("processing", "filled", "error"),
        allowNull: false,
        defaultValue: "processing"
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_order_trailings",
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
    }, {
        name: "action",
        fields: ["action"]
    }]
});
export default OrderTrailing;