import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
export interface CoinAttributes {
    id?: number;
    symbol?: string;
    decimalPrice?: number;
    decimalSize?: number;
    min?: number;
    active?: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
interface CoinCreationAttributes extends Optional<CoinAttributes, "id"> {}
export class Coin extends Model<CoinAttributes, CoinCreationAttributes> implements CoinAttributes {
    public id?: number;
    public symbol?: string;
    public decimalPrice?: number;
    public decimalSize?: number;
    public min?: number;
    public active?: boolean;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}
Coin.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    decimalPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5
        }
    },
    decimalSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5
        }
    },
    min: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_coins",
    underscored: true,
    indexes: [{
        name: "active",
        fields: ["active"]
    }, {
        name: "symbol",
        fields: ["symbol"],
        unique: true
    }]
});
export default Coin;