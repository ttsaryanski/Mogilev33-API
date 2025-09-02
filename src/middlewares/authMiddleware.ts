import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../lib/jwt.js";

import { RequestUser } from "../types/express.js";

import { CustomError } from "../utils/errorUtils/customError.js";

import { InvalidToken } from "../models/InvalidToken.js";

const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            throw new CustomError("Missing token!", 401);
        }
        const invalidToken = await InvalidToken.findOne({ token });

        if (invalidToken) {
            throw new CustomError("Invalid token!", 403);
        }

        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new CustomError("JWT refresh secret is not configured!", 500);
        }
        const decodedToken = await verifyJwt(token, secret);

        req.user = decodedToken as RequestUser;
        req.isAuthenticated = true;

        next();
    } catch (error) {
        if (req.cookies.refreshToken) {
            res.clearCookie("refreshToken");
        }

        next(error);
    }
};

export { authMiddleware };
