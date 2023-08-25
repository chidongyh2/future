import { Request, Response, NextFunction } from "express";
import { Logs, Binance } from "../sequelize";
import Logger from "../helpers/logger";
import { BodyAttributes } from "../typings/datatable";
import { convertFuncToString, getInfo, encodeBase64 } from "../utils/datatable";
// import moment from "moment";
const moment: any = null;
const list = async(req: Request, res: Response, next: NextFunction) => {
    res.render("data/list", {
        site: {
            title: "Logs",
            key: "logs",
            type: "logs",
            action: "list",
            isDatatable: true,
            datatable: {
                isDelete: true,
                url: "logs",
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
                    title: "Binance",
                    dataIndex: "BinanceId",
                    keyIndex: "BinanceId",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${full.Binance.email}</span>`;
                    })
                }, {
                    title: "Symbol",
                    dataIndex: "symbol",
                    keyIndex: "symbol",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${data}</span>`;
                    })
                }, {
                    title: "Type",
                    dataIndex: "type",
                    keyIndex: "type",
                    filter: true,
                    sorter: true,
                    defaultValue: [{
                        name: "Open",
                        value: "open"
                    }, {
                        name: "Dca",
                        value: "dca"
                    }, {
                        name: "Close",
                        value: "close"
                    }],
                    render: convertFuncToString((data, type, full, meta) => {
                        let className = "light";
                        switch(data) {
                            case "open":
                                className = "success";
                                break;
                            case "dca":
                                className = "primary";
                                break;
                            case "close":
                                className = "danger";
                                break;
                        }
                        return `<span class="badge badge-${className}">${data}</span>`;
                    })
                }, {
                    title: "Mark",
                    dataIndex: "markPercent",
                    keyIndex: "markPercent",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-primary">${data}%</span>`;
                    })
                }, {
                    title: "Price",
                    dataIndex: "price",
                    keyIndex: "price",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-success">$${data}</span>`;
                    })
                }, {
                    title: "Time",
                    dataIndex: "createdAt",
                    keyIndex: "createdAt",
                    filter: false,
                    sorter: true,
                    render: convertFuncToString((data, type, full, meta) => {
                        return `<span class="badge badge-light">${moment(data).format("DD-MM-YYYY HH:mm:ss")}</span>`;
                    })
                }]
            }
        }
    })
}
const del = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    Logs.destroy({
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
    Logs.findAndCountAll({
        where: info.where,
        limit: info.limit,
        offset: info.offset,
        order: info.order,
        include: [{
            model: Binance
        }]
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
    del,
    ajax
}
export default {
    list,
    del,
    ajax
}