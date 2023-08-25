import { Router } from "express";
import { add, info, edit, del, ajax, list, check, closeAll, closeOrderRequest, getBalance } from "../controllers/binance.controller";
const router = Router();

router.get("/", list);
router.post("/add", add);
router.get("/info/:id", info);
router.post("/edit", edit);
router.post("/delete", del);
router.get("/check/:id", check);
router.post("/ajax", ajax);
router.post("/close-all", closeAll);
router.post("/close-order", closeOrderRequest);
router.get("/balance", getBalance);

export default router;