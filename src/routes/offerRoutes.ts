import { Router } from "express";

import { offerController } from "../controllers/offerController.js";
import { offerService } from "../services/offerService.js";

const router = Router();

router.use("/", offerController(offerService));

export default router;
