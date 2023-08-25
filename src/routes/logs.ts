import { Router } from "express";
import { isAdmin } from "../middlewares/server.middleware";
import { del, ajax, list } from "../controllers/logs.controller";
const router = Router();

router.use(isAdmin);
router.get("/", list);
router.post("/delete", del);
router.post("/ajax", ajax);

export default router;