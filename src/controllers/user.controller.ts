import { Request, Response, NextFunction } from "express";
import { User } from "../sequelize";
import Logger from "../helpers/logger";
import { BodyAttributes } from "../typings/datatable";
import { convertFuncToString, getInfo } from "../utils/datatable";
import CryptoJS from "crypto-js";
const list = async(req: Request, res: Response, next: NextFunction) => {
    res.render("data/list", {
        site: {
            title: "User",
            key: "user",
            type: "user",
            action: "list",
            isDatatable: true,
            datatable: {
                isAdd: true,
                isEdit: true,
                isDelete: true,
                url: "user",
                listData: [{
                    title: "id",
                    dataIndex: "id",
                    keyIndex: "id",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return data;
                    })
                }, {
                    title: "Username",
                    dataIndex: "username",
                    keyIndex: "username",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<label>${data}</label>`;
                    })
                }, {
                    title: "Ugroup",
                    dataIndex: "ugroup",
                    keyIndex: "ugroup",
                    filter: true,
                    sorter: true,
                    defaultValue: [{
                        name: "Member",
                        value: "member"
                    }, {
                        name: "Admin",
                        value: "admin"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-${data === "admin" ? "success" : "danger"}">${data === "admin" ? "Admin" : "Member"}</span>`
                    })
                }],
                addData: [{
                    title: "Username",
                    keyIndex: "username",
                    type: "input",
                    required: true,
                    validate: "text"
                }, {
                    title: "Password",
                    keyIndex: "password",
                    type: "input",
                    required: true,
                    validate: "text"
                }, {
                    title: "Ugroup",
                    keyIndex: "ugroup",
                    type: "select2",
                    defaultValue: [{
                        name: "Member",
                        value: "member"
                    }, {
                        name: "Admin",
                        value: "admin"
                    }],
                    required: true
                }],
                editData: [{
                    title: "id",
                    keyIndex: "id",
                    type: "hidden",
                    required: true
                }, {
                    title: "Username",
                    keyIndex: "username",
                    type: "readonly",
                    required: false,
                    validate: "text"
                }, {
                    title: "Password",
                    keyIndex: "password",
                    type: "input",
                    required: false,
                    validate: "text"
                }, {
                    title: "Ugroup",
                    keyIndex: "ugroup",
                    type: "select2",
                    defaultValue: [{
                        name: "Member",
                        value: "member"
                    }, {
                        name: "Admin",
                        value: "admin"
                    }],
                    required: true
                }]
            }
        }
    })
}
const add = (req: Request, res: Response, next: NextFunction) => {
    let { username, password, ugroup } = req.body;
    User.create({
        username,
        password: CryptoJS.MD5(password).toString(),
        ugroup
    }).then((data) => {
        res.json({
            status: 1,
            data
        });
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const info = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.params;
    User.findOne({
        where: {
            id
        },
        attributes: ["id", "username", "ugroup"]
    }).then((data) => {
        if(data != null) {
            res.json({
                status: 1,
                data
            })
        } else {
            next({
                status: 404,
                msg: "Not found"
            })
        }
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const edit = (req: Request, res: Response, next: NextFunction) => {
    let { id, ugroup, password } = req.body;
    let update: any = {
        ugroup
    };
    if(password) update.password = CryptoJS.MD5(password).toString();
    User.update(update, {
        where: {
            id
        }
    }).then(() => {
        res.json({
            status: 1,
            msg: "Update success"
        })
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const del = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    User.destroy({
        where: {
            id
        }
    }).then(() => {
        res.json({
            status: 1
        })
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
const ajax = (req: Request, res: Response, next: NextFunction) => {
    let body: BodyAttributes = req.body;
	let info = getInfo(body);
    User.findAndCountAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order
    }).then((values) => {
        let data = values.rows;
		let total = values.count;
		res.json({
			status: 1,
			data,
			recordsTotal: total,
			recordsFiltered: total,
			pages: Math.ceil(total / info.limit),
		});
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Error"
        })
    })
}
export {
    list,
    add,
    info,
    edit,
    del,
    ajax
}
export default {
    list,
    add,
    info,
    edit,
    del,
    ajax
}