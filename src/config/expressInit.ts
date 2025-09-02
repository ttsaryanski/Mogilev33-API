import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { swaggerUi, swaggerDocument } from "../swagger.js";

const isDev = process.env.NODE_ENV === "development";

const allowedOrigins = [
    "https://mogilev33-b1d4b.web.app",
    "https://mogilev33-admin.web.app",
];

if (isDev) {
    allowedOrigins.push("http://localhost:5173");
}

export default function expressInit(app: Application) {
    app.set("trust proxy", 1);
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true,
        })
    );
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
