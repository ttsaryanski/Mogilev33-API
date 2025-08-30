import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncErrorHandler =
    (
        fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
    ): RequestHandler =>
    (_req, _res, _next) => {
        Promise.resolve(fn(_req, _res, _next)).catch(_next);
    };
