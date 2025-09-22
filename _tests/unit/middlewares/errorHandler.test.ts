import { Request, Response, NextFunction } from "express";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { ErrorTypes } from "../../../src/types/ErrorTypes.js";

import { createErrorMsg } from "../../../src/utils/errorUtils/errorUtil.js";

jest.mock("../../../src/utils/errorUtils/errorUtil.js", () => ({
    createErrorMsg: jest.fn(() => "Generated error message"),
}));

describe("errorHandler Middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            headersSent: false,
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should default to status 500 if no statusCode or status is provided", () => {
        const mockError: ErrorTypes = {
            name: "TestError",
            message: "Error without status",
        };
        errorHandler(
            mockError as ErrorTypes,
            req as Request,
            res as Response,
            next
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Generated error message",
        });
    });

    it("should log the error and send a JSON response with status and message", () => {
        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation();
        const mockError = { message: "Test error", statusCode: 400 };
        errorHandler(
            mockError as ErrorTypes,
            req as Request,
            res as Response,
            next
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "ErrorHandler middleware error",
            mockError
        );
        expect(createErrorMsg).toHaveBeenCalledWith(mockError);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Generated error message",
        });
    });

    it("should call next with the error if headers are already sent", () => {
        res.headersSent = true;
        const mockError = { message: "Another test error" };
        errorHandler(
            mockError as ErrorTypes,
            req as Request,
            res as Response,
            next
        );
        expect(next).toHaveBeenCalledWith(mockError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should use err.status if statusCode is not provided", () => {
        const mockError = { message: "Forbidden error", status: 403 };

        errorHandler(
            mockError as ErrorTypes,
            req as Request,
            res as Response,
            next
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: "Generated error message",
        });
    });
});
