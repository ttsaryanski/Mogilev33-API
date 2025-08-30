import express from "express";
import dotenv from "dotenv";
dotenv.config();

import expressInit from "./config/expressInit.js";
import routes from "./routes/routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
expressInit(app);

app.use("/api", routes);
app.get("/", (req, res) => {
    res.send("Mogilev33 API is running!");
});
app.use(errorHandler);

export default app;
