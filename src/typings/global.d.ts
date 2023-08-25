import { UserAttributes } from "../models/user.model";
export interface IConfigPage {
    btnAdd?: boolean,
    isAdd?: boolean,
    isAddMulti?: boolean,
    isEdit?: boolean,
    isDelete?: boolean,
    isCloseAll?: boolean,
    isCloseOrder?: boolean,
    isCheck?: boolean,
    isClearCache?: boolean,
    isGetBalance?: boolean,
    filterDate?: boolean,
    url: string,
    listData: IList[],
    addData?: IModal[],
    multiData?: IModal[],
    editData?: IModal[],
    closeOrderData?: IModal[]
}
export interface IValue {
    name: string,
    value: string
}
export interface IModal {
    title: string,
    keyIndex: string,
    type: "input" | "textarea" | "select" | "checkbox" | "taggify" | "ckeditor" | "select2" | "hidden" | "readonly",
    validate?: "url" | "email" | "number" | "date" | "tel" | "text" | "time" | "password",
    dropdown?: string,
    placeholder?: string,
    pattern?: string,
    multi?: boolean,
    required?: boolean,
    isAdmin?: boolean,
    value?: string,
    min?: string,
    max?: string,
    step?: string,
    defaultValue?: IValue[]
}
export interface IList {
    title: string,
    keyIndex: string,
    dataIndex: string,
    sorter: boolean,
    filter: boolean,
    isAdmin?: boolean,
    defaultValue?: IValue[],
    render: string
}

declare global {
    namespace NodeJS {
        interface Global {
            pathRoot?: string;
            domain?: string;
        }
    }
}
declare module "express" {
    interface Request {
        user?: UserAttributes;
    }
    interface Response {
        render: (view: string, options?: {
            site: {
                title: string,
                key: string,
                type: "dashboard" | "setting" | "user" | "binance" | "proxy" | "coin" | "chart" | "tools" | "statistics" | "order" | "logs",
                action?: "list" | "add" | "order_trailings" | "order_markets" | "positions" | "overview" | "profit",
                isDatatable?: boolean,
                isWizard?: boolean,
                datatable?: IConfigPage,
                list?: any
            }
        } | ((err: Error, html: string) => void), callback?: (err: Error, html: string) => void) => void
    }
}
declare module "express-session" {
    interface Session {
        user?: UserAttributes;
    }
}
export default global;