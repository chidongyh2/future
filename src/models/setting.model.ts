import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
export interface SettingAttributes {
    id?: number;
    key?: string;
    content?: string;
    description?: string;
    type?: "string" | "number" | "boolean";
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
interface SettingCreationAttributes extends Optional<SettingAttributes, "id"> {}
export class Setting extends Model<SettingAttributes, SettingCreationAttributes> implements SettingAttributes {
    public id?: number;
    public key?: string;
    public content?: string;
    public description?: string;
    public type?: "string" | "number" | "boolean";
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}
Setting.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
    },
    type: {
        type: DataTypes.ENUM("string", "number", "boolean"),
        allowNull: false,
        defaultValue: "string"
    }
}, {
    sequelize: dbConfig,
    tableName: "tb_settings",
    underscored: true,
    indexes: [{
        name: "key",
        fields: ["key"],
        unique: true
    }]
});
export default Setting;