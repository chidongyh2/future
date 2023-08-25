import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
import { Binance } from "../sequelize";
export interface LogsAttributes {
    id?: number;
    symbol?: string;
    type?: "open" | "close" | "dca";
    price?: number;
    markPercent?: number;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    BinanceId?: number;
    readonly Binance?: Binance;
}
interface LogsCreationAttributes extends Optional<LogsAttributes, "id"> {}
export class Logs extends Model<LogsAttributes, LogsCreationAttributes> implements LogsAttributes {
    public id?: number;
    public symbol?: string;
    public type?: "open" | "close" | "dca";
    public price?: number;
    public markPercent?: number;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
    public BinanceId?: number;
    public readonly Binance?: Binance;
}
Logs.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ""
    },
    type: {
        type: DataTypes.ENUM("open", "close", "dca"),
        allowNull: false,
        defaultValue: "open"
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    markPercent: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_logs",
    underscored: true,
    indexes: [{
        name: "type",
        fields: ["type"]
    }]
});
export default Logs;