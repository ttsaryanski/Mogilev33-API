import { Router, Response } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { AuthServicesTypes } from "../types/ServicesTypes.js";
import { RequestUser } from "../types/express.js";

import { asyncErrorHandler } from "../utils/errorUtils/asyncErrorHandler.js";
import { CustomError } from "../utils/errorUtils/customError.js";
import { createAccessTokens } from "../services/authService.js";
import { loginLimiter } from "../utils/rateLimiter.js";

import { createUserSchema } from "../validators/user.schema.js";

export function authController(authService: AuthServicesTypes) {
    const router = Router();

    router.post(
        "/register",
        asyncErrorHandler(async (req, res: Response) => {
            const resultData = createUserSchema.safeParse(req.body);

            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const tokens = await authService.register(resultData.data);

            res.status(201)
                .cookie("refreshToken", tokens.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                })
                .json({ accessToken: tokens.accessToken });
        })
    );

    router.post(
        "/login",
        loginLimiter,
        asyncErrorHandler(async (req, res: Response) => {
            const resultData = createUserSchema.safeParse(req.body);

            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const tokens = await authService.login(resultData.data);

            res.status(201)
                .cookie("refreshToken", tokens.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                })
                .json({ accessToken: tokens.accessToken });
        })
    );

    router.post(
        "/logout",
        authMiddleware,
        asyncErrorHandler(async (req, res: Response) => {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                throw new CustomError("No refresh token provided", 401);
            }

            await authService.logout({ refreshToken, accessToken: "" });

            res.status(200)
                .clearCookie("refreshToken", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                })
                .json({ message: "Logged out successfully" });
        })
    );

    router.get(
        "/profile",
        authMiddleware,
        asyncErrorHandler(async (req, res: Response) => {
            const userId = req.user?._id;

            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const user = await authService.getUserById(userId);

            res.status(200).json(user);
        })
    );

    router.post(
        "/refresh",
        authMiddleware,
        asyncErrorHandler(async (req, res) => {
            const user = req.user as RequestUser;

            const tokens = await createAccessTokens({
                _id: user._id,
                email: user.email,
                role: user.role,
            });

            res.status(200).json({ accessToken: tokens.accessToken });
        })
    );

    return router;
}
