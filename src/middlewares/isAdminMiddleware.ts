import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/errorUtils/customError.js";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        throw new CustomError("Admin access required", 403);
    }

    next();
};

export { isAdmin };
