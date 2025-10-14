import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

const mockUserId = new mongoose.Types.ObjectId().toString();
const bucketName = process.env.GCS_BUCKET_NAME || "my-bucket";
const regex = new RegExp(
    `^https://storage\\.googleapis\\.com/${bucketName}/.*\\.pdf$`
);

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
import { Invite, IInvite } from "../../src/models/Invite.js";
import { CreateInviteDataType } from "../../src/validators/invite.schema.js";

const mockFile = {
    originalname: "test.pdf",
    mimetype: "application/pdf",
    buffer: Buffer.from("test"),
    size: 1234,
} as Express.Multer.File;

const mockBigFile = {
    originalname: "test.pdf",
    mimetype: "application/pdf",
    buffer: Buffer.alloc(6 * 1024 * 1024),
    size: 6 * 1024 * 1024,
} as Express.Multer.File;

const mockWrongFile = {
    originalname: "test.png",
    mimetype: "image/png",
    buffer: Buffer.from("test"),
    size: 1234,
} as Express.Multer.File;

describe("GET /invitations", () => {
    it("should return empty array", async () => {
        const res = await request(app).get("/api/invitations");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it("should return all existing invites", async () => {
        await Invite.create([
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
        ] as IInvite[]);

        const res = await request(app).get("/api/invitations");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty("title");
        expect(res.body[0]).toHaveProperty("date");
        expect(res.body[0]).toHaveProperty("fileUrl");
    });
});

describe("POST /invitations", () => {
    beforeEach(async () => {
        await Invite.deleteMany();
    });

    it("should create new invite and return 201", async () => {
        const createData: CreateInviteDataType = {
            title: "Test title",
            date: "2025/12/31",
            fileUrl: "https://example.com/invite.pdf",
        };
        const res = await request(app)
            .post("/api/invitations")
            .send(createData);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body.fileUrl).toBe("https://example.com/invite.pdf");

        const dbEntry = await Invite.findOne({ title: "Test title" });
        expect(dbEntry).not.toBeNull();
    });

    it("should return 400 if data is incorrect - title", async () => {
        const incorrectInviteTitle: CreateInviteDataType = {
            title: "T",
            date: "2025/12/31",
            fileUrl: "https://example.com/invite.pdf",
        };

        const res = await request(app)
            .post("/api/invitations")
            .send(incorrectInviteTitle);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invite title should be at least 3 characters long!"
        );

        const dbEntry = await Invite.findOne({ title: "T" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - date", async () => {
        const incorrectInviteDate: CreateInviteDataType = {
            title: "Test title",
            date: "31-12-2025",
            fileUrl: "https://example.com/invite.pdf",
        };
        const res = await request(app)
            .post("/api/invitations")
            .send(incorrectInviteDate);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );

        const dbEntry = await Invite.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - fileUrl", async () => {
        const incorrectInviteFileUrl: CreateInviteDataType = {
            title: "Test title",
            date: "2025/12/31",
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .post("/api/invitations")
            .send(incorrectInviteFileUrl);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");

        const dbEntry = await Invite.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });
});

describe("PUT /invitations/:inviteId", () => {
    let existingInvite: IInvite;

    beforeEach(async () => {
        await Invite.deleteMany();

        existingInvite = await Invite.create({
            title: "Original Title",
            date: "2025/11/30",
            fileUrl: "https://example.com/original.pdf",
        });
    });

    const updateData: CreateInviteDataType = {
        title: "Updated Title",
        date: "2025/12/31",
        fileUrl: "https://example.com/updated.pdf",
    };

    it("should update invite and return 200", async () => {
        const res = await request(app)
            .put(`/api/invitations/${existingInvite._id}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body.fileUrl).toBe("https://example.com/updated.pdf");

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Updated Title");
    });

    it("should return 400 if inviteId is invalid", async () => {
        const res = await request(app)
            .put("/api/invitations/invalid-id")
            .send(updateData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if invite does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/invitations/${nonExistingId}`)
            .send(updateData);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Invite not found!");
    });

    it("should return 400 if data is invalid", async () => {
        const invalidData: CreateInviteDataType = {
            title: "Up",
            date: "31-12-2025",
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .put(`/api/invitations/${existingInvite._id}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });
});

describe("DELETE /invitations/:inviteId", () => {
    let existingInvite: IInvite;

    beforeEach(async () => {
        await Invite.deleteMany();

        existingInvite = await Invite.create({
            title: "To Be Deleted",
            date: "2025/10/10",
            fileUrl: "https://example.com/tobedeleted.pdf",
        });
    });

    it("should delete invite and return 204", async () => {
        const res = await request(app).delete(
            `/api/invitations/${existingInvite._id}`
        );

        expect(res.status).toBe(204);

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if inviteId is invalid", async () => {
        const res = await request(app).delete("/api/invitations/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry).not.toBeNull();
    });

    it("should return 404 if invite does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).delete(
            `/api/invitations/${nonExistingId}`
        );

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Invite not found!");

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry).not.toBeNull();
    });
});

describe("GET /invitations/:inviteId", () => {
    let existingInvite: IInvite;

    beforeEach(async () => {
        await Invite.deleteMany();

        existingInvite = await Invite.create({
            title: "Existing Invite",
            date: "2025/09/09",
            fileUrl: "https://example.com/existing.pdf",
        });
    });

    it("should return invite by id", async () => {
        const res = await request(app).get(
            `/api/invitations/${existingInvite._id}`
        );

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Existing Invite");
        expect(res.body.date).toBe("2025/09/09");
        expect(res.body.fileUrl).toBe("https://example.com/existing.pdf");
    });

    it("should return 400 if inviteId is invalid", async () => {
        const res = await request(app).get("/api/invitations/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if invite does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/api/invitations/${nonExistingId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Invite not found!");
    });
});

describe("POST /invitations/upload", () => {
    beforeEach(async () => {
        await Invite.deleteMany();
    });

    it("should upload file, create invite and return 201", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "Test title")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body).toHaveProperty("fileUrl");
        expect(res.body.fileUrl).toMatch(regex);
    });

    it("should return 400 if data is incorrect - title", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "V")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invite title should be at least 3 characters long!"
        );

        const dbEntry = await Invite.findOne({ title: "V" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - date", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "Valid Title")
            .field("date", "31-12-2025")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );

        const dbEntry = await Invite.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if file is missing", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "Valid Title")
            .field("date", "2025/12/31");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");

        const dbEntry = await Invite.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 413 if file is too large", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "Valid Title")
            .field("date", "2025/12/31")
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");

        const dbEntry = await Invite.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if file type is incorrect", async () => {
        const res = await request(app)
            .post("/api/invitations/upload")
            .field("title", "Valid Title")
            .field("date", "2025/12/31")
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");

        const dbEntry = await Invite.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });
});

describe("PUT /invitations/upload/:inviteId", () => {
    let existingInvite: IInvite;

    beforeEach(async () => {
        await Invite.deleteMany();

        existingInvite = await Invite.create({
            title: "Original Title",
            date: "2025/11/30",
            fileUrl: "https://example.com/original.pdf",
        });
    });

    it("should upload new file, update invite and return 200", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "Updated Title")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.date).toBe("2025/12/31");
        expect(res.body).toHaveProperty("fileUrl");
        expect(res.body.fileUrl).toMatch(regex);

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Updated Title");
    });

    it("should return 400 if inviteId is invalid", async () => {
        const res = await request(app)
            .put("/api/invitations/upload/invalid-id")
            .field("title", "Updated Title")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if invite does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/invitations/upload/${nonExistingId}`)
            .field("title", "Updated Title")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Invite not found!");
    });

    it("should return 400 if data is incorrect - title", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "V")
            .field("date", "2025/12/31")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invite title should be at least 3 characters long!"
        );

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if data is incorrect - date", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "Valid Title")
            .field("date", "31-12-2025")
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if file is missing", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "Valid Title")
            .field("date", "2025/12/31");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 413 if file is too large", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "Valid Title")
            .field("date", "2025/12/31")
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if file type is incorrect", async () => {
        const res = await request(app)
            .put(`/api/invitations/upload/${existingInvite._id}`)
            .field("title", "Valid Title")
            .field("date", "2025/12/31")
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");

        const dbEntry = await Invite.findById(existingInvite._id);
        expect(dbEntry?.title).toBe("Original Title");
    });
});
