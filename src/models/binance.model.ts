import {
    Model,
    DataTypes,
    Optional,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyCountAssociationsMixin,
    BelongsToManyCreateAssociationMixin,
    BelongsToManyRemoveAssociationsMixin,
    BelongsToManySetAssociationsMixin,
    Association
} from "sequelize";
import { dbConfig } from "../sequelize";
import User from "./user.model";
import Coin from "./coin.model";
import OrderMarket from "./order.market";
import OrderTrailing from "./order.trailing";
export interface BinanceAttributes {
    id?: number;
    email?: string;
    apiKey?: string;
    apiSecret?: string;
    capital?: number;
    budget?: number;
    isAuto?: boolean;
    isTakeProfit?: boolean;
    isDca?: boolean;
    active?: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    UserId?: number;
    readonly User?: User;
    readonly Coins?: Coin[];
    readonly OrderMarkets?: OrderMarket[];
    readonly OrderTrailings?: OrderTrailing[];
}
interface BinanceCreationAttributes extends Optional<BinanceAttributes, "id"> {}
export class Binance extends Model<BinanceAttributes, BinanceCreationAttributes> implements BinanceAttributes {
    public id?: number;
    public email?: string;
    public apiKey?: string;
    public apiSecret?: string;
    public capital?: number;
    public budget?: number;
    public isAuto?: boolean;
    public isTakeProfit?: boolean;
    public isDca?: boolean;
    public active?: boolean;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
    public UserId?: number;
    public readonly User?: User;
    public readonly Coins?: Coin[];
    public readonly OrderMarkets?: OrderMarket[];
    public readonly OrderTrailings?: OrderTrailing[];
    // Relationship
    public getCoins?: BelongsToManyGetAssociationsMixin<Coin>;
    public addCoins?: BelongsToManyAddAssociationMixin<Coin, Coin["id"][]>;
    public hasCoins?: BelongsToManyHasAssociationMixin<Coin, Coin["id"]>;
    public countCoins?: BelongsToManyCountAssociationsMixin;
    public createCoins?: BelongsToManyCreateAssociationMixin<Coin>;
    public removeCoins?: BelongsToManyRemoveAssociationsMixin<Coin, Coin["id"]>;
    public setCoins?: BelongsToManySetAssociationsMixin<Coin, Coin["id"]>;
    public static associations: {
        Coins: Association<Binance, Coin>;
    };
}
Binance.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiSecret: {
        type: DataTypes.STRING,
        allowNull: false
    },
    capital: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    budget: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 10,
        validate: {
            min: 0
        }
    },
    isAuto: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isTakeProfit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isDca: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_binances",
    underscored: true,
    indexes: [{
        name: "email",
        fields: ["email"],
        unique: true
    }, {
        name: "is_auto",
        fields: ["is_auto"]
    }, {
        name: "is_take_profit",
        fields: ["is_take_profit"]
    }, {
        name: "is_dca",
        fields: ["is_dca"]
    }, {
        name: "active",
        fields: ["active"]
    }]
});
export default Binance;