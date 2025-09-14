import request from "supertest";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

const mockUserId = new mongoose.Types.ObjectId().toString();
jest.mock("../../src/middlewares/authMiddleware.js", () => ({
    authMiddleware: (req: Request, res: Response, next: NextFunction) => {
        req.user = {
            _id: mockUserId,
            email: "example@email.com",
            role: "admin",
        };
        req.isAuthenticated = true;

        next();
    },
}));
jest.mock("../../src/middlewares/isAdminMiddleware.js", () => ({
    isAdmin: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import app from "../../src/app";
import { Protocol, IProtocol } from "../../src/models/Protocol.js";

import { CreateProtocolDataType } from "../../src/validators/protocol.schema";

describe("GET /protocols", () => {
    it("should return empty array", async () => {
        const res = await request(app).get("/api/protocols");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it("should return all existing protocols", async () => {
        await Protocol.create([
            {
                title: "Title 1",
                date: "2025/01/01",
                fileUrl: "https://example.com/file1.pdf",
            },
            {
                title: "Title 2",
                date: "2025/01/02",
                fileUrl: "https://example.com/file2.pdf",
            },
        ] as IProtocol[]);

        const res = await request(app).get("/api/protocols");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty("title");
        expect(res.body[0]).toHaveProperty("date");
        expect(res.body[0]).toHaveProperty("fileUrl");
    });
});

describe("POST /protocols", () => {
    beforeEach(async () => {
        await Protocol.deleteMany();
    });

    it("should create new protocol and return 201", async () => {
        const createData: CreateProtocolDataType = {
            title: "Test title",
            date: "2025/12/31",
            fileUrl: "https://example.com/protocol.pdf",
        };
        const res = await request(app).post("/api/protocols").send(createData);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body.fileUrl).toBe("https://example.com/protocol.pdf");

        const dbEntry = await Protocol.findOne({ title: "Test title" });
        expect(dbEntry).not.toBeNull();
    });

    it("should return 400 if data is incorrect - title", async () => {
        const incorrectProtocolTitle: CreateProtocolDataType = {
            title: "T",
            date: "2025/12/31",
            fileUrl: "https://example.com/protocol.pdf",
        };

        const res = await request(app)
            .post("/api/protocols")
            .send(incorrectProtocolTitle);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Protocol title should be at least 3 characters long!"
        );

        const dbEntry = await Protocol.findOne({ title: "T" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - date", async () => {
        const incorrectProtocolDate: CreateProtocolDataType = {
            title: "Test title",
            date: "31-12-2025",
            fileUrl: "https://example.com/protocol.pdf",
        };
        const res = await request(app)
            .post("/api/protocols")
            .send(incorrectProtocolDate);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );

        const dbEntry = await Protocol.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - fileUrl", async () => {
        const incorrectProtocolFileUrl: CreateProtocolDataType = {
            title: "Test title",
            date: "2025/12/31",
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .post("/api/protocols")
            .send(incorrectProtocolFileUrl);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");

        const dbEntry = await Protocol.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });
});

describe("PUT /protocols/:protocolId", () => {
    let existingProtocol: IProtocol;

    beforeEach(async () => {
        await Protocol.deleteMany();

        existingProtocol = await Protocol.create({
            title: "Original Title",
            date: "2025/11/30",
            fileUrl: "https://example.com/original.pdf",
        });
    });

    const updateData: CreateProtocolDataType = {
        title: "Updated Title",
        date: "2025/12/31",
        fileUrl: "https://example.com/updated.pdf",
    };

    it("should update protocol and return 200", async () => {
        const res = await request(app)
            .put(`/api/protocols/${existingProtocol._id}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body.fileUrl).toBe("https://example.com/updated.pdf");

        const dbEntry = await Protocol.findById(existingProtocol._id);
        expect(dbEntry?.title).toBe("Updated Title");
    });

    it("should return 400 if protocolId is invalid", async () => {
        const res = await request(app)
            .put("/api/protocols/invalid-id")
            .send(updateData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if protocol does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/protocols/${nonExistingId}`)
            .send(updateData);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Protocol not found!");
    });

    it("should return 400 if data is invalid", async () => {
        const invalidData: CreateProtocolDataType = {
            title: "Up",
            date: "31-12-2025",
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .put(`/api/protocols/${existingProtocol._id}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();

        const dbEntry = await Protocol.findById(existingProtocol._id);
        expect(dbEntry?.title).toBe("Original Title");
    });
});

describe("DELETE /protocols/:protocolId", () => {
    let existingProtocol: IProtocol;

    beforeEach(async () => {
        await Protocol.deleteMany();

        existingProtocol = await Protocol.create({
            title: "To Be Deleted",
            date: "2025/10/10",
            fileUrl: "https://example.com/tobedeleted.pdf",
        });
    });

    it("should delete protocol and return 204", async () => {
        const res = await request(app).delete(
            `/api/protocols/${existingProtocol._id}`
        );

        expect(res.status).toBe(204);

        const dbEntry = await Protocol.findById(existingProtocol._id);
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if protocolId is invalid", async () => {
        const res = await request(app).delete("/api/protocols/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );

        const dbEntry = await Protocol.findById(existingProtocol._id);
        expect(dbEntry).not.toBeNull();
    });

    it("should return 404 if protocol does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).delete(
            `/api/protocols/${nonExistingId}`
        );

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Protocol not found!");

        const dbEntry = await Protocol.findById(existingProtocol._id);
        expect(dbEntry).not.toBeNull();
    });
});

describe("GET /protocols/:protocolId", () => {
    let existingProtocol: IProtocol;

    beforeEach(async () => {
        await Protocol.deleteMany();

        existingProtocol = await Protocol.create({
            title: "Existing Protocol",
            date: "2025/09/09",
            fileUrl: "https://example.com/existing.pdf",
        });
    });

    it("should return protocol by id", async () => {
        const res = await request(app).get(
            `/api/protocols/${existingProtocol._id}`
        );

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Existing Protocol");
        expect(res.body.date).toBe("2025/09/09");
        expect(res.body.fileUrl).toBe("https://example.com/existing.pdf");
    });

    it("should return 400 if protocolId is invalid", async () => {
        const res = await request(app).get("/api/protocols/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if protocol does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/api/protocols/${nonExistingId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Protocol not found!");
    });
});
