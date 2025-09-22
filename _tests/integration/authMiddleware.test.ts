import request from "supertest";
import * as jwt from "../../src/lib/jwt.js";
import app from "../../src/app";

import { InvalidToken } from "../../src/models/InvalidToken.js";
import { User } from "../../src/models/User.js";
jest.mock("../../src/models/User", () => ({
    User: {
        findById: jest.fn(),
    },
}));
jest.mock("../../src/models/InvalidToken", () => ({
    InvalidToken: {
        findOne: jest.fn(),
    },
}));

describe("Auth Middleware Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return 401 if no token is provided", async () => {
        const res = await request(app).get("/api/auth/profile");

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Missing token!");
    });

    test("should return 403 if token is invalid", async () => {
        (InvalidToken.findOne as jest.Mock).mockResolvedValue({
            token: "invalid-token",
        });
        const res = await request(app)
            .get("/api/auth/profile")
            .set("Cookie", ["refreshToken=invalid-token"]);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Invalid token!");
    });

    test("should call route if token is valid", async () => {
        const validPayload = {
            _id: "507f1f77bcf86cd799439011",
            email: "test@example.com",
            role: "user",
        };
        (InvalidToken.findOne as jest.Mock).mockResolvedValue(null);
        (User.findById as jest.Mock).mockResolvedValue({
            _id: validPayload._id,
            email: validPayload.email,
            role: validPayload.role,
        });
        const validToken = await jwt.signJwt(
            validPayload,
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: "1h" }
        );

        const res = await request(app)
            .get("/api/auth/profile")
            .set("Cookie", [`refreshToken=${validToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe(validPayload.email);
    });
});
