import { Router } from "express";
import { isAdmin } from "../middlewares/server.middleware";
import { add, info, edit, del, ajax, list } from "../controllers/user.controller";
const router = Router();

router.use(isAdmin);
router.get("/", list);
router.post("/add", add);
router.get("/info/:id", info);
router.post("/edit", edit);
router.post("/delete", del);
router.post("/ajax", ajax);

export default router;