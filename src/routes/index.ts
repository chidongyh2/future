import { Router, Request, Response, NextFunction } from "express";
import { checkError, checkNotFound } from "../middlewares/error.middleware";
import auth from "./auth";
import dashboard from "./dashboard";
import dotenv from "dotenv";
const router = Router();
dotenv.config();
const DASHBOARD = process.env.DASHBOARD;
router.get("/", (req: Request, res: Response) => {
    res.redirect(`/${DASHBOARD}/`);
});
router.use("/auth", auth);
router.use(`/${DASHBOARD}`, dashboard);
router.use(checkError);
router.use("*", checkNotFound);

export default router;