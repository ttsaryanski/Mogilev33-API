import { Request, Response, NextFunction } from "express";

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

    const status = err.statusCode || err.status || 500;
    const message = createErrorMsg(err);

    res.status(status).json({ message });
}
