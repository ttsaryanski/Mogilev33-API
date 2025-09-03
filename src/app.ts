import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

import expressInit from "./config/expressInit.js";
import routes from "./routes/routes.js";
import errorHandler from "./middlewares/errorHandler.js";

interface CsrfError extends Error {
    code?: string;
}

const app = express();
expressInit(app);

app.use("/api", routes);
app.get("/", (req, res) => {
    res.send("Mogilev33 API is running!");
});
app.use((err: CsrfError, req: Request, res: Response, next: NextFunction) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid CSRF token" });
    }
    next(err);
});
app.use(errorHandler);

export default app;
