import { Router } from "express";
import { generateUser, loginUser, getUser } from "../controllers/auth.controller";
import { isLogin } from "../middlewares/server.middleware";
const router = Router();

router.use("/generate", generateUser);
router.use("/login", loginUser);
// router.use("/register", registerUser);
router.use(isLogin);
router.use("/get-user", getUser);

export default router;