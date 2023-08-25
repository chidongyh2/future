import { Router } from "express";
import { add, info, edit, del, ajax, list, addMulti } from "../controllers/coin.controller";
const router = Router();

router.get("/", list);
router.post("/add", add);
router.post("/multi", addMulti);
router.get("/info/:id", info);
router.post("/edit", edit);
router.post("/delete", del);
router.post("/ajax", ajax);

export default router;