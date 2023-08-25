import { Router } from "express";
import { viewPositions, getPositions, viewProfit, getProfit, viewOverview, getOverview, getTableOverview, getChartProfit, getChartBinance } from "../controllers/statistics/index.controller";
const router = Router();

router.post("/chart/profit", getChartProfit);
router.post("/chart/binance", getChartBinance);
router.post("/dashboard/:select(day|week|month|all)", getTableOverview);
// positions
router.get("/positions/", viewPositions);
router.post("/positions/ajax", getPositions);
// profit
router.get("/profit/", viewProfit);
router.post("/profit/ajax", getProfit);
// overview
router.get("/overview/", viewOverview);
router.post("/overview/ajax", getOverview);

export default router;