import { Router } from "express";

import { authController } from "../controllers/authController.js";
import { authService } from "../services/authService.js";

const router = Router();

router.use("/", authController(authService));

export default router;
