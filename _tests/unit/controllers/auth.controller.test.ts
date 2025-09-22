import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { authController } from "../../../src/controllers/authController.js";
import { createAccessTokens } from "../../../src/services/authService.js";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { AuthServicesTypes } from "../../../src/types/ServicesTypes.js";
import { UserResponseType } from "../../../src/types/UserTypes.js";
import { CreateUserDataType } from "../../../src/validators/user.schema.js";

const validId = new mongoose.Types.ObjectId().toString();
jest.mock("../../../src/middlewares/authMiddleware.js", () => ({
    authMiddleware: (req: Request, res: Response, next: NextFunction) => {
        req.user = {
            _id: validId,
            email: "example@email.com",
            role: "admin",
        };
        req.isAuthenticated = true;

        next();
    },
}));
jest.mock("../../../src/services/authService.js", () => ({
    createAccessTokens: jest.fn().mockResolvedValue({
        accessToken: "mocked-access-token",
    }),
}));

const mockAuthService: jest.Mocked<AuthServicesTypes> = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getUserById: jest.fn(),
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authController(mockAuthService));
app.use(errorHandler);

const mockUser: UserResponseType = {
    _id: "64b2f9d4f8a1e4e1c5a9c123",
    email: "test@example.com",
    role: "user",
    createdAt: new Date(),
};

const validCredentials: CreateUserDataType = {
    email: "test@example.com",
    password: "123456",
};

describe("authController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /register - should register, set cookie and return accessTocken", async () => {
        const mockTokens = {
            accessToken: "mockAccessToken",
            refreshToken: "mockRefreshToken",
        };
        mockAuthService.register.mockResolvedValue(mockTokens);

        const res = await request(app)
            .post("/auth/register")
            .send(validCredentials);

        expect(res.statusCode).toBe(201);
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
        expect(res.body).toEqual({ accessToken: "mockAccessToken" });
        expect(mockAuthService.register).toHaveBeenCalledWith(validCredentials);
    });

    test("POST /register - should return 400 for invalid email", async () => {
        const res = await request(app).post("/auth/register").send({
            email: "invalid-email",
            password: "123456",
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Invalid email format!");
        expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    test("POST /register - should return 400 for invalid password", async () => {
        const res = await request(app).post("/auth/register").send({
            email: "test@example.com",
            password: "123",
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(
            "Password should be at least 6 characters long!"
        );
        expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    test("POST /login - should login, set cookie and return accessTocken", async () => {
        const mockTokens = {
            accessToken: "mockAccessToken",
            refreshToken: "mockRefreshToken",
        };
        mockAuthService.login.mockResolvedValue(mockTokens);

        const res = await request(app)
            .post("/auth/login")
            .send(validCredentials);

        expect(res.statusCode).toBe(201);
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
        expect(res.body).toEqual({ accessToken: "mockAccessToken" });
        expect(mockAuthService.login).toHaveBeenCalledWith(validCredentials);
    });

    test("POST /login - should return 400 for invalid email", async () => {
        const res = await request(app).post("/auth/login").send({
            email: "invalid-email",
            password: "123456",
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Invalid email format!");
        expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    test("POST /login - should return 400 for invalid password", async () => {
        const res = await request(app).post("/auth/login").send({
            email: "test@example.com",
            password: "123",
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(
            "Password should be at least 6 characters long!"
        );
        expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    test("POST /logout - should logout and return 200", async () => {
        const refreshToken = "mockRefreshToken";
        mockAuthService.logout.mockResolvedValue(undefined);

        const res = await request(app)
            .post("/auth/logout")
            .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Logged out successfully!");
        expect(mockAuthService.logout).toHaveBeenCalledWith({
            refreshToken: refreshToken,
            accessToken: "",
        });
    });

    test("POST /logout - should return 401 if no refresh token", async () => {
        const res = await request(app).post("/auth/logout");

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("No refresh token provided!");
        expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    test("GET /user - should return user data for authenticated user", async () => {
        mockAuthService.getUserById.mockResolvedValue(mockUser);
        const res = await request(app).get("/auth/profile");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            _id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            createdAt: mockUser.createdAt.toISOString(),
        });
        expect(mockAuthService.getUserById).toHaveBeenCalledWith(validId);
    });

    test("GET /refresh - should return new access token for authenticated user", async () => {
        const res = await request(app).post("/auth/refresh");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ accessToken: "mocked-access-token" });
        expect(createAccessTokens).toHaveBeenCalledWith({
            _id: validId,
            email: "example@email.com",
            role: "admin",
        });
    });
});
