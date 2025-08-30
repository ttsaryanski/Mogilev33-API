import { Router } from "express";

import { inviteController } from "../controllers/inviteController.js";
import { inviteService } from "../services/inviteService.js";

const router = Router();

router.use("/", inviteController(inviteService));

export default router;
