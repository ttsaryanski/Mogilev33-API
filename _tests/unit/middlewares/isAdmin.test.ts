import { Request, Response, NextFunction } from "express";

import { isAdmin } from "../../../src/middlewares/isAdminMiddleware.js";

import { CustomError } from "../../../src/utils/errorUtils/customError.js";

describe("isAdmin Middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            user: undefined,
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should throw 403 if user role is not admin", () => {
        req.user = {
            _id: "userId",
            email: "example@email.com",
            role: "user",
        };
        try {
            isAdmin(req as Request, res as Response, next);
            fail("Expected isAdmin to throw, but it did not");
        } catch (err) {
            expect(err).toBeInstanceOf(CustomError);
            expect((err as CustomError).message).toBe("Admin access required!");
            expect((err as CustomError).statusCode).toBe(403);
        }
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next if user role is admin", () => {
        req.user = {
            _id: "userId",
            email: "example@email.com",
            role: "admin",
        };
        isAdmin(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });
});
