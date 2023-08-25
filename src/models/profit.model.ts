import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
import Binance from "./binance.model";
import User from "./user.model";
export interface ProfitAttributes {
    id?: number;
    symbol?: string;
    pnl?: number;
    margin?: number;
    pnlPercent?: number;
    position?: number;
    content?: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    BinanceId?: number;
    Binance?: Binance;
    UserId?: number;
    User?: User;
}
interface ProfitCreationAttributes extends Optional<ProfitAttributes, "id"> {}
export class Profit extends Model<ProfitAttributes, ProfitCreationAttributes> implements ProfitAttributes {
    public id?: number;
    public symbol?: string;
    public pnl?: number;
    public margin?: number;
    public pnlPercent?: number;
    public entry?: number;
    public content?: string;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
    public BinanceId?: number;
    public readonly Binance?: Binance;
    public UserId?: number;
    public readonly User?: User;
}
Profit.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pnl: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    margin: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    pnlPercent: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 2
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "{}"
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_profits",
    underscored: true,
    indexes: [{
        name: "symbol",
        fields: ["symbol"]
    }]
});
export default Profit;