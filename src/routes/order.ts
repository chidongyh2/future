import { Router } from "express";
import { getOrderTrailing, viewOrderTrailing, getOrderMarket, viewOrderMarket } from "../controllers/order/index.controller";
const router = Router();

// open-orders
router.get("/trailings/", viewOrderTrailing);
router.post("/trailings/ajax", getOrderTrailing);

router.get("/markets/", viewOrderMarket);
router.post("/markets/ajax", getOrderMarket);

export default router;