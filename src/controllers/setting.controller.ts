import { Request, Response, NextFunction } from "express";
import { Setting } from "../sequelize";
import Logger from "../helpers/logger";
import { BodyAttributes } from "../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../utils/datatable";
import { clearCache } from "../utils/cache";
import redis from "../redis";
import getSetting from "../utils/setting";
const list = async(req: Request, res: Response, next: NextFunction) => {
    res.render("data/list", {
        site: {
            title: "Setting",
            key: "setting",
            type: "setting",
            action: "list",
            isDatatable: true,
            datatable: {
                isAdd: true,
                isEdit: true,
                isDelete: true,
                isClearCache: true,
                url: "setting",
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
                    title: "Key",
                    dataIndex: "key",
                    keyIndex: "key",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`
                    })
                }, {
                    title: "Content",
                    dataIndex: "content",
                    keyIndex: "content",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<label>${data}</label>`;
                    })
                }, {
                    title: "Description",
                    dataIndex: "description",
                    keyIndex: "description",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<label>${data}</label>`;
                    })
                }, {
                    title: "Type",
                    dataIndex: "type",
                    keyIndex: "type",
                    filter: true,
                    sorter: true,
                    isAdmin: true,
                    defaultValue: [{
                        name: "String",
                        value: "string"
                    }, {
                        name: "Number",
                        value: "number"
                    }, {
                        name: "Boolean",
                        value: "boolean"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${data}</span>`
                    })
                }],
                addData: [{
                    title: "Key",
                    keyIndex: "key",
                    type: "input",
                    required: true
                }, {
                    title: "Content",
                    keyIndex: "content",
                    type: "textarea",
                    required: true
                }, {
                    title: "Description",
                    keyIndex: "description",
                    type: "textarea",
                    required: false
                }, {
                    title: "Type",
                    keyIndex: "type",
                    type: "select2",
                    defaultValue: [{
                        name: "String",
                        value: "string"
                    }, {
                        name: "Number",
                        value: "number"
                    }, {
                        name: "Boolean",
                        value: "boolean"
                    }],
                    required: true
                }],
                editData: [{
                    title: "id",
                    keyIndex: "id",
                    type: "hidden",
                    required: true
                }, {
                    title: "Key",
                    keyIndex: "key",
                    type: "input",
                    required: true
                }, {
                    title: "Content",
                    keyIndex: "content",
                    type: "textarea",
                    required: true
                }, {
                    title: "Description",
                    keyIndex: "description",
                    type: "textarea",
                    required: false
                }, {
                    title: "Type",
                    keyIndex: "type",
                    type: "select2",
                    defaultValue: [{
                        name: "String",
                        value: "string"
                    }, {
                        name: "Number",
                        value: "number"
                    }, {
                        name: "Boolean",
                        value: "boolean"
                    }],
                    required: true
                }]
            }
        }
    })
}
const add = (req: Request, res: Response, next: NextFunction) => {
    let { key, content, description, type } = req.body;
    Setting.create({
        key,
        content,
        description,
        type
    }).then((data) => {
        clearCache({
            type: "all_setting"
        });
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
    Setting.findOne({
        where: {
            id
        }
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
    let { id, key, content, description, type } = req.body;
    Setting.update({
        key,
        content,
        description,
        type
    }, {
        where: {
            id
        }
    }).then(() => {
        clearCache({
            type: "all_setting"
        });
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
    Setting.destroy({
        where: {
            id
        }
    }).then(() => {
        clearCache({
            type: "all_setting"
        });
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
    Setting.findAndCountAll({
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
const clearAllCache = (req: Request, res: Response, next: NextFunction) => {
    redis.flushall().then(() => {
        res.json({
            status: 1,
            msg: "Clear cache thành công"
        })
    }).catch((err) => {
        Logger.error(err);
        next({
            status: 500,
            msg: "Đã xảy ra lỗi"
        })
    })
}
const requestGetSetting = (req: Request, res: Response, next: NextFunction) => {
    let { key } = req.query;
    getSetting(String(key)).then((content) => {
        res.json({
            status: 1,
            content
        })
    }).catch((err) => {
        next({
            status: 500,
            msg: "Không tìm thấy setting"
        })
    })
}
export {
    list,
    add,
    info,
    edit,
    del,
    ajax,
    clearAllCache,
    requestGetSetting
}
export default {
    list,
    add,
    info,
    edit,
    del,
    ajax,
    clearAllCache,
    requestGetSetting
}