interface IColumn {
    data: string,
    name: string,
    searchable: "true" | "false" | boolean,
    orderable: "true" | "false"  | boolean,
    search: ISearch
}
interface ISearch {
    value: string,
    regex: "true" | "false"  | boolean
}
interface IOrder {
    column: string | number,
    dir: "asc" | "desc" | "ASC" | "DESC"
}
export interface BodyAttributes {
    draw: string | number,
    columns: IColumn[],
    order: IOrder[],
    start: string | number,
    length: string | number,
    search: ISearch
}
export interface ExportAttributes {
    where: any,
    order: any,
    limit: number,
    offset: number
}