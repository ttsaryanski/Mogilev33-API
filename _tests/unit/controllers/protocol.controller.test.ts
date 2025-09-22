import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import mongoose from "mongoose";

import { protocolController } from "../../../src/controllers/protocolController.js";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { ProtocolServicesTypes } from "../../../src/types/ServicesTypes.js";
import { ProtocolResponseType } from "../../../src/types/ProtocolTypes.js";
import { CreateProtocolDataType } from "../../../src/validators/protocol.schema.js";

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
jest.mock("../../../src/middlewares/isAdminMiddleware.js", () => ({
    isAdmin: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const mockProtocolsService: jest.Mocked<ProtocolServicesTypes> = {
    getAll: jest.fn(),
    create: jest.fn(),
    edit: jest.fn(),
    remove: jest.fn(),
    getById: jest.fn(),
};

const app = express();
app.use(express.json());
app.use("/protocols", protocolController(mockProtocolsService));
app.use(errorHandler);

describe("Protocols Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /protocols - should return all protocols", async () => {
        const mockData = [
            {
                title: "New protocol",
                date: "2023/12/31",
                fileUrl: "http://example.com/protocol.pdf",
                _id: validId,
                createdAt: new Date(),
            },
        ];
        mockProtocolsService.getAll.mockResolvedValue(mockData);

        const res = await request(app).get("/protocols");
        const resBody = res.body as ProtocolResponseType[];

        expect(res.status).toBe(200);
        expect([
            {
                ...resBody[0],
                createdAt: new Date(resBody[0].createdAt),
            },
        ]).toEqual(mockData);
    });

    test("GET /protocols - should return 500 on service error", async () => {
        mockProtocolsService.getAll.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get("/protocols");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });

    test("POST /protocols - should create a protocol", async () => {
        const newProtocol: CreateProtocolDataType = {
            title: "New protocol",
            date: "2023/12/31",
            fileUrl: "http://example.com/protocol.pdf",
        };
        const createdProtocol: ProtocolResponseType = {
            ...newProtocol,
            _id: validId,
            createdAt: new Date(),
        };
        mockProtocolsService.create.mockResolvedValue(createdProtocol);

        const res = await request(app).post("/protocols").send(newProtocol);
        const resBody = res.body as ProtocolResponseType;

        expect(res.status).toBe(201);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(createdProtocol);
        expect(mockProtocolsService.create).toHaveBeenCalledWith(newProtocol);
    });

    test("POST /protocols - should return 400 for invalid data - title", async () => {
        const invalidData = {
            title: "T",
            date: "2023/12/31",
            fileUrl: "http://example.com/protocol.pdf",
        };

        const res = await request(app).post("/protocols").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Protocol title should be at least 3 characters long!"
        );
    });

    test("POST /protocols - should return 400 for invalid data - date", async () => {
        const invalidData = {
            title: "Valid title",
            date: "31-12-2023",
            fileUrl: "http://example.com/protocol.pdf",
        };

        const res = await request(app).post("/protocols").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );
    });

    test("POST /protocols - should return 400 for invalid data - fileUrl", async () => {
        const invalidData = {
            title: "Valid title",
            date: "2023/12/31",
            fileUrl: "invalid-url",
        };

        const res = await request(app).post("/protocols").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /protocols/:protocolId - should edit protocol", async () => {
        const editData: CreateProtocolDataType = {
            title: "Edited protocol title",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-protocol.pdf",
        };
        const updatedProtocol: ProtocolResponseType = {
            ...editData,
            _id: validId,
            createdAt: new Date(),
        };
        mockProtocolsService.edit.mockResolvedValue(updatedProtocol);

        const res = await request(app)
            .put(`/protocols/${validId}`)
            .send(editData);
        const resBody = res.body as ProtocolResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(updatedProtocol);
        expect(mockProtocolsService.edit).toHaveBeenCalledWith(
            validId,
            editData
        );
    });

    test("PUT /protocols/:protocolId - should return 400 for invalid update data - title", async () => {
        const invalidData: CreateProtocolDataType = {
            title: "T",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-protocol.pdf",
        };

        const res = await request(app)
            .put(`/protocols/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Protocol title should be at least 3 characters long!"
        );
    });

    test("PUT /protocols/:protocolId - should return 400 for invalid update data - date", async () => {
        const invalidData: CreateProtocolDataType = {
            title: "Valid title",
            date: "15-01-2024",
            fileUrl: "http://example.com/edited-protocol.pdf",
        };

        const res = await request(app)
            .put(`/protocols/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );
    });

    test("PUT /protocols/:protocolId - should return 400 for invalid update data - fileUrl", async () => {
        const invalidData: CreateProtocolDataType = {
            title: "Valid title",
            date: "2024/01/15",
            fileUrl: "invalid-url",
        };

        const res = await request(app)
            .put(`/protocols/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /protocols/:protocolId - should return 400 for invalid protocol ID", async () => {
        const validData: CreateProtocolDataType = {
            title: "Valid title",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-protocol.pdf",
        };

        const res = await request(app)
            .put("/protocols/invalidId")
            .send(validData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("DELETE /protocols/:protocolId - should delete protocol", async () => {
        mockProtocolsService.remove.mockResolvedValue();

        const res = await request(app).delete(`/protocols/${validId}`);
        const resBody = res.body as ProtocolResponseType;

        expect(res.status).toBe(204);
        expect(resBody).toEqual({});
        expect(mockProtocolsService.remove).toHaveBeenCalledWith(validId);
    });

    test("DELETE /protocols/:protocolId - should return 400 for invalid invite ID", async () => {
        const res = await request(app).delete("/protocols/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /protocols/:protocolId - should return protocol by ID", async () => {
        const mockData = {
            title: "New protocol",
            date: "2023/12/31",
            fileUrl: "http://example.com/protocol.pdf",
            _id: validId,
            createdAt: new Date(),
        };
        mockProtocolsService.getById.mockResolvedValue(mockData);

        const res = await request(app).get(`/protocols/${validId}`);
        const resBody = res.body as ProtocolResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(mockData);
    });

    test("GET /protocols/:protocolId - should return 400 for invalid protocol ID", async () => {
        const res = await request(app).get("/protocols/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /protocols/:protocolId - should return 500 on service error", async () => {
        mockProtocolsService.getById.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get(`/protocols/${validId}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });
});
