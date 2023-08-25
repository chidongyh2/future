import { Model, DataTypes, Optional } from "sequelize";
import { dbConfig } from "../sequelize";
export interface UserAttributes {
    id?: number;
    username?: string;
    password?: string;
    ugroup?: "admin" | "member";
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id?: number;
    public username?: string;
    public password?: string;
    public ugroup?: "admin" | "member";
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}
User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: new DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: new DataTypes.STRING({
            length: 32
        }),
        allowNull: false
    },
    ugroup: {
        type: new DataTypes.ENUM("member", "admin"),
        allowNull: false,
        defaultValue: "member"
    },
}, {
    sequelize: dbConfig,
    tableName: "tb_users",
    underscored: true,
    indexes: [{
        name: "username",
        fields: ["username"],
        unique: true
    }, {
        name: "ugroup",
        fields: ["ugroup"]
    }]
});
export default User;