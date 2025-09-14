import request from "supertest";
import mongoose, { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";

const mockUserId = new mongoose.Types.ObjectId().toString();
jest.mock("../../src/middlewares/authMiddleware.js", () => ({
    authMiddleware: (req: Request, res: Response, next: NextFunction) => {
        req.user = {
            _id: global.userId || mockUserId,
            email: "example@email.com",
            role: "admin",
        };
        req.isAuthenticated = true;
        next();
    },
}));

import app from "../../src/app";
import { User, IUser } from "../../src/models/User.js";
import { InvalidToken } from "../../src/models/InvalidToken";

import { CreateUserDataType } from "../../src/validators/user.schema.js";

import { createAccessTokens } from "../../src/services/authService";

describe("POST /auth/register", () => {
    beforeEach(async () => {
        await User.deleteMany();

        const existingUser: Partial<IUser> = {
            email: "existing@email.com",
            password: "password123",
        };
        await User.create(existingUser);
    });

    it("should register a new user", async () => {
        const userData: CreateUserDataType = {
            email: "example@email.com",
            password: "password123",
        };
        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);

        const userInDb = await User.findOne({ email: userData.email });
        expect(userInDb).not.toBeNull();
        expect(userInDb?.email).toBe(userData.email);

        const cookie = res.headers["set-cookie"][0];
        expect(cookie).toBeDefined();
        expect(cookie).toMatch(/refreshToken=/);
        expect(cookie).toMatch(/HttpOnly/);
        expect(cookie).toMatch(/Secure/);
        expect(cookie).toMatch(/SameSite=None/);
    });

    it("should return 409 if email already registered", async () => {
        const userData: CreateUserDataType = {
            email: "existing@email.com",
            password: "password123",
        };
        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("This email already registered!");
    });

    it("should return 400 for invalid email", async () => {
        const userData: CreateUserDataType = {
            email: "invalid-email",
            password: "password123",
        };
        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid email format!");
    });

    it("should return 400 for short password", async () => {
        const userData: CreateUserDataType = {
            email: "example@email.com",
            password: "short",
        };
        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Password should be at least 6 characters long!"
        );
    });
});

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await User.deleteMany();

        const existingUser: Partial<IUser> = {
            email: "existing@email.com",
            password: "password123",
        };
        await User.create(existingUser);
    });

    it("should login an existing user", async () => {
        const userData: CreateUserDataType = {
            email: "existing@email.com",
            password: "password123",
        };
        const res = await request(app).post("/api/auth/login").send(userData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);

        const userInDb = await User.findOne({ email: userData.email });
        expect(userInDb).not.toBeNull();
        expect(userInDb?.email).toBe(userData.email);

        const cookie = res.headers["set-cookie"][0];
        expect(cookie).toBeDefined();
        expect(cookie).toMatch(/refreshToken=/);
        expect(cookie).toMatch(/HttpOnly/);
        expect(cookie).toMatch(/Secure/);
        expect(cookie).toMatch(/SameSite=None/);
    });

    it("should return 404 if user does not exist", async () => {
        const userData: CreateUserDataType = {
            email: "example@email.com",
            password: "password123",
        };
        const res = await request(app).post("/api/auth/login").send(userData);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User does not exist!");
    });

    it("should return 401 for incorrect password", async () => {
        const userData: CreateUserDataType = {
            email: "existing@email.com",
            password: "wrongpassword",
        };
        const res = await request(app).post("/api/auth/login").send(userData);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Password does not match!");
    });

    it("should return 400 for invalid email", async () => {
        const userData: CreateUserDataType = {
            email: "invalid-email",
            password: "password123",
        };
        const res = await request(app).post("/api/auth/login").send(userData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid email format!");
    });

    it("should return 400 for short password", async () => {
        const userData: CreateUserDataType = {
            email: "existing@email.com",
            password: "short",
        };
        const res = await request(app).post("/api/auth/login").send(userData);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Password should be at least 6 characters long!"
        );
    });
});

describe("POST /auth/logout", () => {
    const userData: CreateUserDataType = {
        email: "example@email.com",
        password: "password123",
    };

    let refreshToken: string;
    beforeEach(async () => {
        await User.deleteMany();
        await InvalidToken.deleteMany();

        const tokens = await createAccessTokens({
            _id: mockUserId,
            email: userData.email,
            role: "admin",
        });
        refreshToken = tokens.refreshToken;
    });

    it("should logout user and invalidate refresh token", async () => {
        const res = await request(app)
            .post("/api/auth/logout")
            .set("Cookie", `refreshToken=${refreshToken}`)
            .send();

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Logged out successfully!");
        expect(res.headers["set-cookie"][0]).toMatch(
            /refreshToken=; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None/
        );
        const tokenInDb = await InvalidToken.findOne({ token: refreshToken });
        expect(tokenInDb).not.toBeNull();
    });

    it("should return 401 if no refresh token provided", async () => {
        const res = await request(app).post("/api/auth/logout").send();

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("No refresh token provided!");
    });
});

describe("GET /auth/profile", () => {
    beforeEach(async () => {
        await User.deleteMany();
    });

    const userData: CreateUserDataType = {
        email: "example@email.com",
        password: "password123",
    };

    it("should get user profile", async () => {
        const createdUser = await User.create({
            email: "example@email.com",
            password: "password123",
        });
        global.userId = (createdUser._id as Types.ObjectId).toString();
        const res = await request(app).get("/api/auth/profile").send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("_id", global.userId);
        expect(res.body).toHaveProperty("email", userData.email);
        expect(res.body).toHaveProperty("role", "user");
        expect(res.body).not.toHaveProperty("password");
    });

    it("should return 404 if user not exist", async () => {
        await User.create({
            email: "profile@email.com",
            password: "password123",
        });
        global.userId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get("/api/auth/profile").send();

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("There is no user with this id!");
    });
});

describe("POST /auth/refresh", () => {
    it("should refresh access token", async () => {
        const res = await request(app).post("/api/auth/refresh").send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
    });
});
