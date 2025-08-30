import { Router } from "express";

import { protocolController } from "../controllers/protocolController.js";
import { protocolService } from "../services/protocolService.js";

const router = Router();

router.use("/", protocolController(protocolService));

export default router;
