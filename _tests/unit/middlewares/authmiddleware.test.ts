import { Request, Response, NextFunction } from "express";

import { authMiddleware } from "../../../src/middlewares/authMiddleware";

import * as jwt from "../../../src/lib/jwt.js";

import { InvalidToken } from "../../../src/models/InvalidToken.js";

jest.mock("../../../src/lib/jwt.js");
jest.mock("../../../src/models/InvalidToken.js");

describe("authMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    const mockUserPayload = {
        _id: "userId",
        email: "example@email.com",
        role: "user",
    };

    beforeEach(() => {
        req = {
            cookies: {},
        };
        res = {
            clearCookie: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should throw 401 if no token is present", async () => {
        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Missing token!",
                statusCode: 401,
            })
        );
    });

    it("should throw 403 if token is in InvalidToken list", async () => {
        req.cookies = { refreshToken: "invalidToken" };
        (InvalidToken.findOne as jest.Mock).mockResolvedValue(true);

        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );

        expect(InvalidToken.findOne).toHaveBeenCalledWith({
            token: "invalidToken",
        });
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid token!",
                statusCode: 403,
            })
        );
    });

    it("should throw 500 if JWT_REFRESH_SECRET is not set", async () => {
        req.cookies = { refreshToken: "someToken" };
        (InvalidToken.findOne as jest.Mock).mockResolvedValue(null);

        const originalSecret = process.env.JWT_REFRESH_SECRET;
        delete process.env.JWT_REFRESH_SECRET;

        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "JWT refresh secret is not configured!",
                statusCode: 500,
            })
        );

        process.env.JWT_REFRESH_SECRET = originalSecret;
    });

    it("should authenticate and call next() if token is valid", async () => {
        req.cookies = { refreshToken: "validToken" };
        (InvalidToken.findOne as jest.Mock).mockResolvedValue(null);
        (jwt.verifyJwt as jest.Mock).mockResolvedValue(mockUserPayload);
        process.env.JWT_REFRESH_SECRET = "testsecret";

        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );

        expect(jwt.verifyJwt).toHaveBeenCalledWith("validToken", "testsecret");
        expect(req.user).toEqual(mockUserPayload);
        expect(req.isAuthenticated).toBe(true);
        expect(next).toHaveBeenCalledWith();
    });

    it("should clear cookie and call next with error if token verification fails", async () => {
        req.cookies = { refreshToken: "someToken" };
        (InvalidToken.findOne as jest.Mock).mockResolvedValue(null);
        (jwt.verifyJwt as jest.Mock).mockRejectedValue(new Error("Invalid"));
        process.env.JWT_REFRESH_SECRET = "testsecret";

        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );

        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should clear cookie and call next with error if InvalidToken query fails", async () => {
        req.cookies = { refreshToken: "someToken" };
        (InvalidToken.findOne as jest.Mock).mockRejectedValue(
            new Error("DB error")
        );
        process.env.JWT_REFRESH_SECRET = "testsecret";

        await authMiddleware(
            req as Request,
            res as Response,
            next as NextFunction
        );

        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
