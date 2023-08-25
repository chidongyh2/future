import { BodyAttributes, ExportAttributes } from "../typings/datatable";
import { Op } from "sequelize";
import CryptoJS from "crypto-js";
import { IModal } from "../typings/global";
const getWhere = (body: BodyAttributes) => {
    let where: any = {};
    let searchAll = [], searchItem = [];
    let filterSearch = body.columns.filter((col) => {
        return col.search.value != "";
    });
    if(filterSearch.length > 0) {
        for(const column of filterSearch) {
            const equalList = ["status", "UserId", "BinanceId"];
            const booleanList = ["active"];
            if(equalList.includes(column.data)) {
                if(booleanList.includes(column.data)) {
                    try {
                        searchItem.push({
                            [column.data]: {
                                [Op.eq]: JSON.parse(column.search.value)
                            }
                        })
                    } catch(ex) {
                        searchItem.push({
                            [column.data]: {
                                [Op.eq]: column.search.value
                            }
                        })
                    }
                } else {
                    searchItem.push({
                        [column.data]: {
                            [Op.eq]: column.search.value
                        }
                    })
                }
            } else if(column.data === "createdAt") {
                try {
                    let info = column.search.value.split(" - ");
                    let start = new Date(info[0].trim());
                    start.setHours(0,0,0,0);
                    let end = new Date(info.pop().trim());
                    end.setHours(23,59,59,999);
                    searchItem.push({
                        [column.data]: {
                            [Op.gte]: start
                        }
                    })
                    searchItem.push({
                        [column.data]: {
                            [Op.lte]: end
                        }
                    })
                } catch(ex) {
                    console.error(ex);
                }
            } else {
                searchItem.push({
                    [column.data]: {
                        [Op.like]: `%${column.search.value}%`
                    }
                })
            }
        }
    }
    if(body.search.value) {
        for(const column of body.columns) {
            if(column.data !== "createdAt" && column.data !== "updatedAt") {
                searchAll.push({
                    [column.data]: {
                        [Op.like]: `%${body.search.value}%`
                    }
                })
            }
        }
    }
    if(searchAll.length > 0 && searchItem.length > 0) {
        where[Op.and] = [{
            [Op.or]: searchAll
        }, {
            [Op.or]: searchItem
        }]
    } else {
        if(searchAll.length > 0) where[Op.or] = searchAll;
        if(searchItem.length > 0) where[Op.and] = searchItem;
    }
    return where;
}
const getOrder = (body: BodyAttributes): string[][]=> {
    let {
        columns,
        order
    }: any = body;
    let orders = [];
    if(order.length > 0) {
        for(const item of order) {
            orders.push([columns[item.column].data, item.dir])
        }
        return orders;
    } else {
        return [["id", "desc"]];
    }
}
const getInfo = (body: BodyAttributes): ExportAttributes => {
    let {
        columns,
        length,
        order,
        search,
        start
    } = body;
    let where: any = getWhere(body);
    let object = {
        where,
        order: getOrder(body),
        limit: Number(length),
        offset: Number(start)
    }
    return object;
}
const getWhereStatistics = (body: BodyAttributes) => {
    let filterSearch = body.columns.filter((col) => {
        return col.search.value != "";
    });
    return filterSearch;
}
const getInfoStatistics = (body: BodyAttributes): ExportAttributes => {
    let {
        columns,
        length,
        order,
        search,
        start
    } = body;
    let where: any = getWhereStatistics(body);
    let object = {
        where,
        order: getOrder(body),
        limit: Number(length),
        offset: Number(start)
    }
    return object;
}
const convertFuncToString = (fn: (data: any, type: any, full: any, meta: any) => void): string => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(fn.toString()));
}
const encodeBase64 = (str: string) => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
}
const decodeBase64 = (str: string) => {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(str));
}
const generateInput = (item: IModal, type: "add" | "edit" | "closeOrder" | "getTrailing") => {
    switch(item.type) {
        case "hidden":
            return `<input ${type === "closeOrder" ? `id="${item.keyIndex}"` : ""} ${item.value ? `value="${item.value}"` : ""} ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} ${item.validate ? `type="${item.validate}"` : ""} ${item.pattern ? `pattern="${decodeBase64(item.pattern)}"` : ""} type="hidden" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>`;
        case "input":
            return `<input ${item.value ? `value="${item.value}"` : ""} ${item.step ? `step="${item.step}"` : ""} ${item.min ? `min="${item.min}"` : ""} ${item.max ? `max="${item.max}"` : ""} ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} ${item.validate ? `type="${item.validate}"` : ""} ${item.pattern ? `pattern="${decodeBase64(item.pattern)}"`: ""} class="form-control form-control-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>`;
        case "readonly":
                return `<input ${item.value ? `value="${item.value}"` : ""} ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} ${item.validate ? `type="${item.validate}"` : ""} ${item.pattern ? `pattern="${decodeBase64(item.pattern)}"`: ""} class="form-control form-control-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" readonly ${item.required && "required"}>`;
        case "textarea":
            return `<textarea ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} rows="5" class="form-control form-control-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>${item.value ? item.value : ""}</textarea>`;
        case "select":
            return `<select ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} data-placeholder="Select ${item.title}" class="form-select form-select-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>
                        ${item.defaultValue.map((option) => { 
                            return `<option value="${option.value}">${option.name}</option>`;
                        })}
                    </select>`;
        case "select2":
            return `<select data-allow-clear="true" data-control="select2" ${item.multi ? `multiple="multiple"` : ""} ${item.dropdown ? `data-dropdown-parent="#${item.dropdown}"` : `data-hide-search="true"`} data-placeholder="Select ${item.title}" class="form-select form-select-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>
                        ${item.defaultValue.map((option) => { 
                            return `<option value="${option.value}">${option.name}</option>`;
                        })}
                    </select>`;
        default: 
            return `<input ${item.placeholder ? `placeholder="${item.placeholder}"` : ""} ${item.validate ? `type="${item.validate}"` : ""} ${item.pattern ? `pattern="${decodeBase64(item.pattern)}"`: ""} class="form-control form-control-solid" ${(type === "edit" || type === "closeOrder" || type === "getTrailing") ? `id="${item.keyIndex}"` : ""} name="${item.keyIndex}" ${item.required && "required"}>`;
    }
}
const generateModal = (data: IModal[], type: "add" | "edit" | "closeOrder" | "getTrailing", session: any) => {
    let html = ``;
    for(const item of data) {
        if(item.isAdmin) {
            if(session.user.ugroup === "admin") {
                if(item.type != "hidden") {
                    html += `<div class="form-group mb-4">
                                <label class="fs-6 fw-bold mb-2 ${item.required && "required"}">${item.title}</label>
                                ${generateInput(item, type)}
                            </div>`;
                } else {
                    html += `<div class="form-group mb-4">
                                ${generateInput(item, type)}
                            </div>`;
                }
            }
        } else {
            if(item.type != "hidden") {
                html += `<div class="form-group mb-4">
                            <label class="fs-6 fw-bold mb-2 ${item.required && "required"}">${item.title}</label>
                            ${generateInput(item, type)}
                        </div>`;
            } else {
                html += `<div class="form-group mb-4">
                            ${generateInput(item, type)}
                        </div>`;
            }
        }
    }
    return html;
}
export {
    convertFuncToString,
    getWhere,
    getInfo,
    getInfoStatistics,
    generateModal,
    encodeBase64,
    decodeBase64
}
export default {
    convertFuncToString,
    getWhere,
    getInfo,
    getInfoStatistics,
    generateModal,
    encodeBase64,
    decodeBase64
}