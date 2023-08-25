import { Router } from "express";
import { isLogin, isAdmin } from "../middlewares/server.middleware";
import { Dashboard, Logout } from "../controllers/dashboard.controller";
import user from "./user";
import setting from "./setting";
import binance from "./binance";
import coin from "./coin";
import statistics from "./statistics";
import order from "./order";
import logs from "./logs";
const router = Router();

router.use(isLogin);
router.get("/", Dashboard);
router.use("/setting", setting);
router.use("/binance", binance);
router.use("/coin", coin);
router.use("/statistics", statistics);
router.use("/order", order);
router.use("/user", user);
router.use("/logs", logs);
router.get("/logout", Logout);

export default router;