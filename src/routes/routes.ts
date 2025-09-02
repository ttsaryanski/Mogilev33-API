import { Router } from "express";

import authRoutes from "./authRoutes.js";
import protocolRoutes from "./protocolRoutes.js";
import offerRoutes from "./offerRoutes.js";
import inviteRoutes from "./inviteRoutes.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/protocols", protocolRoutes);
routes.use("/offers", offerRoutes);
routes.use("/invitations", inviteRoutes);

export default routes;
