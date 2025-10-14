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
import { Offer, IOffer } from "../../src/models/Offer.js";
import { CreateOfferDataType } from "../../src/validators/offer.schema";

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

describe("GET /offers", () => {
    it("should return empty array", async () => {
        const res = await request(app).get("/api/offers");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it("should return all existing offers", async () => {
        await Offer.create([
            {
                title: "Title 1",
                company: "Company 1",
                price: 100,
                fileUrl: "https://example.com/file1.pdf",
            },
            {
                title: "Title 2",
                company: "Company 2",
                price: 200,
                fileUrl: "https://example.com/file2.pdf",
            },
        ] as IOffer[]);

        const res = await request(app).get("/api/offers");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty("title");
        expect(res.body[0]).toHaveProperty("company");
        expect(res.body[0]).toHaveProperty("price");
        expect(res.body[0]).toHaveProperty("fileUrl");
    });
});

describe("POST /offers", () => {
    beforeEach(async () => {
        await Offer.deleteMany();
    });

    it("should create new offer and return 201", async () => {
        const createData: CreateOfferDataType = {
            title: "Test title",
            company: "Test company name",
            price: 100,
            fileUrl: "https://example.com/offer.pdf",
        };
        const res = await request(app).post("/api/offers").send(createData);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.company).toBe("Test company name");
        expect(res.body.price).toBe(100);
        expect(res.body.fileUrl).toBe("https://example.com/offer.pdf");

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).not.toBeNull();
    });

    it("should return 400 if data is incorrect - title", async () => {
        const incorrectOfferTitle: CreateOfferDataType = {
            title: "T",
            company: "Test company name",
            price: 100,
            fileUrl: "https://example.com/offer.pdf",
        };

        const res = await request(app)
            .post("/api/offers")
            .send(incorrectOfferTitle);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );

        const dbEntry = await Offer.findOne({ title: "T" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - company name", async () => {
        const incorrectOfferCompanyName: CreateOfferDataType = {
            title: "Test title",
            company: "C",
            price: 100,
            fileUrl: "https://example.com/Offer.pdf",
        };
        const res = await request(app)
            .post("/api/offers")
            .send(incorrectOfferCompanyName);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - price", async () => {
        const incorrectOfferPrice: CreateOfferDataType = {
            title: "Test title",
            company: "Test company name",
            price: -100,
            fileUrl: "https://example.com/Offer.pdf",
        };
        const res = await request(app)
            .post("/api/offers")
            .send(incorrectOfferPrice);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - fileUrl", async () => {
        const incorrectOfferFileUrl: CreateOfferDataType = {
            title: "Test title",
            company: "Test company name",
            price: 100,
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .post("/api/offers")
            .send(incorrectOfferFileUrl);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });
});

describe("PUT /offers/:offerId", () => {
    let existingOffer: IOffer;

    beforeEach(async () => {
        await Offer.deleteMany();

        existingOffer = await Offer.create({
            title: "Original Title",
            company: "Original Company",
            price: 150,
            fileUrl: "https://example.com/original.pdf",
        });
    });

    const updateData: CreateOfferDataType = {
        title: "Updated Title",
        company: "Updated Company",
        price: 250,
        fileUrl: "https://example.com/updated.pdf",
    };

    it("should update offer and return 200", async () => {
        const res = await request(app)
            .put(`/api/offers/${existingOffer._id}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.company).toBe("Updated Company");
        expect(res.body.price).toBe(250);
        expect(res.body.fileUrl).toBe("https://example.com/updated.pdf");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Updated Title");
    });

    it("should return 400 if offerId is invalid", async () => {
        const res = await request(app)
            .put("/api/offers/invalid-id")
            .send(updateData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if offer does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/offers/${nonExistingId}`)
            .send(updateData);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Offer not found!");
    });

    it("should return 400 if data is invalid", async () => {
        const invalidData: CreateOfferDataType = {
            title: "Up",
            company: "C",
            price: -50,
            fileUrl: "invalid-url",
        };
        const res = await request(app)
            .put(`/api/offers/${existingOffer._id}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });
});

describe("DELETE /offers/:offerId", () => {
    let existingOffer: IOffer;

    beforeEach(async () => {
        await Offer.deleteMany();

        existingOffer = await Offer.create({
            title: "To Be Deleted",
            company: "Delete Company",
            price: 300,
            fileUrl: "https://example.com/tobedeleted.pdf",
        });
    });

    it("should delete offer and return 204", async () => {
        const res = await request(app).delete(
            `/api/offers/${existingOffer._id}`
        );

        expect(res.status).toBe(204);

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if offerId is invalid", async () => {
        const res = await request(app).delete("/api/offers/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry).not.toBeNull();
    });

    it("should return 404 if offer does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).delete(`/api/offers/${nonExistingId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Offer not found!");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry).not.toBeNull();
    });
});

describe("GET /offers/:offerId", () => {
    let existingOffer: IOffer;

    beforeEach(async () => {
        await Offer.deleteMany();

        existingOffer = await Offer.create({
            title: "Existing Offer",
            company: "Existing Company",
            price: 400,
            fileUrl: "https://example.com/existing.pdf",
        });
    });

    it("should return offer by id", async () => {
        const res = await request(app).get(`/api/offers/${existingOffer._id}`);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Existing Offer");
        expect(res.body.company).toBe("Existing Company");
        expect(res.body.price).toBe(400);
        expect(res.body.fileUrl).toBe("https://example.com/existing.pdf");
    });

    it("should return 400 if offerId is invalid", async () => {
        const res = await request(app).get("/api/offers/invalid-id");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    it("should return 404 if offer does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/api/offers/${nonExistingId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Offer not found!");
    });
});

describe("POST /offers/upload", () => {
    beforeEach(async () => {
        await Offer.deleteMany();
    });

    it("should upload file, create new offer and return 201", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Test title")
            .field("company", "Test company name")
            .field("price", 100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.company).toBe("Test company name");
        expect(res.body.price).toBe(100);
        expect(res.body.fileUrl).toMatch(regex);

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).not.toBeNull();
    });

    it("should return 400 if data is incorrect - title", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "V")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );

        const dbEntry = await Offer.findOne({ title: "V" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - company name", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Valid Title")
            .field("company", "V")
            .field("price", 100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );

        const dbEntry = await Offer.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if data is incorrect - price", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", -100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");

        const dbEntry = await Offer.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if file is missing", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");

        const dbEntry = await Offer.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 413 if file is too large", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");

        const dbEntry = await Offer.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });

    it("should return 400 if file type is incorrect", async () => {
        const res = await request(app)
            .post("/api/offers/upload")
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");

        const dbEntry = await Offer.findOne({ title: "Valid Title" });
        expect(dbEntry).toBeNull();
    });
});

describe("PUT /offers/upload/:offerId", () => {
    let existingOffer: IOffer;

    beforeEach(async () => {
        await Offer.deleteMany();

        existingOffer = await Offer.create({
            title: "Original Title",
            company: "Original Company",
            price: 150,
            fileUrl: "https://example.com/original.pdf",
        });
    });

    it("should upload file, update offer and return 200", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Updated Title")
            .field("company", "Updated Company")
            .field("price", 250)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.company).toBe("Updated Company");
        expect(res.body.price).toBe(250);
        expect(res.body.fileUrl).toMatch(regex);

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Updated Title");
    });

    it("should return 400 if offerId is invalid", async () => {
        const res = await request(app)
            .put("/api/offers/upload/invalid-id")
            .field("title", "Updated Title")
            .field("company", "Updated Company")
            .field("price", 250)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 404 if offer does not exist", async () => {
        const nonExistingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/offers/upload/${nonExistingId}`)
            .field("title", "Updated Title")
            .field("company", "Updated Company")
            .field("price", 250)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Offer not found!");
    });

    it("should return 400 if data is incorrect - title", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "V")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if data is incorrect - company name", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Valid Title")
            .field("company", "V")
            .field("price", 100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if data is incorrect - price", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", -100)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if file is missing", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 413 if file is too large", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });

    it("should return 400 if file type is incorrect", async () => {
        const res = await request(app)
            .put(`/api/offers/upload/${existingOffer._id}`)
            .field("title", "Valid Title")
            .field("company", "Valid company name")
            .field("price", 100)
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");

        const dbEntry = await Offer.findById(existingOffer._id);
        expect(dbEntry?.title).toBe("Original Title");
    });
});
