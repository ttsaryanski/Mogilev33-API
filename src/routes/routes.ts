import { Router } from "express";

import protocolRoutes from "./protocolController.js";
import offerRoutes from "./offerController.js";
import inviteRoutes from "./inviteController.js";

const routes = Router();

routes.use("/protocols", protocolRoutes);
routes.use("/offers", offerRoutes);
routes.use("/invitations", inviteRoutes);

export default routes;
