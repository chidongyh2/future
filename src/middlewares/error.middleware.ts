import { Request, Response, NextFunction } from "express";
import url from "url";
interface ErroAttributes {
    status: 404 | 401 | 500;
}
const checkError = (err: ErroAttributes, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.status ?? 500).json(err);
}
const checkNotFound = (req: Request, res: Response) => {
    const info = url.parse(req.originalUrl);
    res.status(404).end(`Cannot ${req.method} ${info.pathname}`);
}
export {
    checkError,
    checkNotFound
}
export default {
    checkError,
    checkNotFound
}