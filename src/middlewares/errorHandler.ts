import { Request, Response, NextFunction } from "express";
import multer from "multer";

import { ErrorTypes } from "../types/ErrorTypes.js";

import { createErrorMsg } from "../utils/errorUtils/errorUtil.js";

export default function errorHandler(
    err: ErrorTypes,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error("ErrorHandler middleware error", err);

    if (res.headersSent) {
        return next(err);
    }

    let status = err.statusCode || err.status || 500;
    const message = createErrorMsg(err);

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        status = 413;
    }

    res.status(status).json({ message });
}
