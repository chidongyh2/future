import { Router } from "express";
import { add, info, edit, del, ajax, list, clearAllCache, requestGetSetting } from "../controllers/setting.controller";
const router = Router();

router.get("/", list);
router.post("/add", add);
router.get("/info/:id", info);
router.post("/edit", edit);
router.post("/delete", del);
router.post("/ajax", ajax);
router.get("/clearCache", clearAllCache);
router.get("/get", requestGetSetting);

export default router;