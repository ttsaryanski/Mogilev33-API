import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import helmet from "helmet";
import { appLimiter } from "../utils/rateLimiter.js";
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
    app.use(appLimiter);
    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        })
    );
    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true,
        })
    );
    if (process.env.NODE_ENV !== "test") {
        const csrfProtection = csurf({
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite:
                    process.env.NODE_ENV === "production" ? "none" : "lax",
            },
        });

        app.use((req, res, next) => {
            const isSwaggerUI =
                req.path.startsWith("/docs") ||
                (req.headers.referer && req.headers.referer.includes("/docs"));

            if (isSwaggerUI) {
                return next();
            }

            return csrfProtection(req, res, next);
        });

        app.get("/api/csrf-token", (req, res) => {
            res.json({ csrfToken: req.csrfToken() });
        });
        app.use(
            "/api/docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerDocument, {
                swaggerOptions: isDev
                    ? {}
                    : {
                          tryItOutEnabled: false,
                          supportedSubmitMethods: [],
                      },
            })
        );
    }
}
