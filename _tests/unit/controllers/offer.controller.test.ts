import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import mongoose from "mongoose";

import { offerController } from "../../../src/controllers/offerController.js";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { OfferServicesTypes } from "../../../src/types/ServicesTypes.js";
import { OfferResponseType } from "../../../src/types/OfferTypes.js";
import {
    CreateOfferDataType,
    CreateOfferWithUploadDataType,
} from "../../../src/validators/offer.schema.js";

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

const mockOffersService: jest.Mocked<OfferServicesTypes> = {
    getAll: jest.fn(),
    create: jest.fn(),
    createWithFile: jest.fn(),
    edit: jest.fn(),
    editWithFile: jest.fn(),
    remove: jest.fn(),
    removeAndRemoveFromGCS: jest.fn(),
    getById: jest.fn(),
};

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

const app = express();
app.use(express.json());
app.use("/offers", offerController(mockOffersService));
app.use(errorHandler);

describe("Offers Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /offers - should return all offers", async () => {
        const mockData = [
            {
                title: "New offers",
                company: "Some Company",
                price: 100,
                fileUrl: "http://example.com/offer.pdf",
                _id: validId,
                createdAt: new Date(),
            },
        ];
        mockOffersService.getAll.mockResolvedValue(mockData);

        const res = await request(app).get("/offers");
        const resBody = res.body as OfferResponseType[];

        expect(res.status).toBe(200);
        expect([
            {
                ...resBody[0],
                createdAt: new Date(resBody[0].createdAt),
            },
        ]).toEqual(mockData);
    });

    test("GET /offers - should return 500 on service error", async () => {
        mockOffersService.getAll.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get("/offers");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });

    test("POST /offers - should create a offer", async () => {
        const newOffer: CreateOfferDataType = {
            title: "New offer title",
            company: "Some Company",
            price: 150,
            fileUrl: "http://example.com/offer.pdf",
        };
        const createdOffer: OfferResponseType = {
            ...newOffer,
            _id: validId,
            createdAt: new Date(),
        };
        mockOffersService.create.mockResolvedValue(createdOffer);

        const res = await request(app).post("/offers").send(newOffer);
        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(201);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(createdOffer);
        expect(mockOffersService.create).toHaveBeenCalledWith(newOffer);
    });

    test("POST /offers - should return 400 for invalid data - title", async () => {
        const invalidData = {
            title: "V",
            company: "Valid Company",
            price: 150,
            fileUrl: "http://example.com/offer.pdf",
        };

        const res = await request(app).post("/offers").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );
    });

    test("POST /offers - should return 400 for invalid data - company", async () => {
        const invalidData = {
            title: "Valid title",
            company: "V",
            price: 150,
            fileUrl: "http://example.com/offer.pdf",
        };

        const res = await request(app).post("/offers").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );
    });

    test("POST /offers - should return 400 for invalid data - price", async () => {
        const invalidData = {
            title: "Valid title",
            company: "Valid Company",
            price: -150,
            fileUrl: "http://example.com/offer.pdf",
        };

        const res = await request(app).post("/offers").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");
    });

    test("POST /offers - should return 400 for invalid data - fileUrl", async () => {
        const invalidData = {
            title: "Valid title",
            company: "Valid Company",
            price: 150,
            fileUrl: "invalid-url",
        };

        const res = await request(app).post("/offers").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /offers/:offerId - should edit offer", async () => {
        const editData: CreateOfferDataType = {
            title: "Edited offer title",
            company: "Edited Company",
            price: 200,
            fileUrl: "http://example.com/edited-offer.pdf",
        };
        const updatedOffer: OfferResponseType = {
            ...editData,
            _id: validId,
            createdAt: new Date(),
        };
        mockOffersService.edit.mockResolvedValue(updatedOffer);

        const res = await request(app).put(`/offers/${validId}`).send(editData);
        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(updatedOffer);
        expect(mockOffersService.edit).toHaveBeenCalledWith(validId, editData);
    });

    test("PUT /offers/:offerId - should return 400 for invalid update data - title", async () => {
        const invalidData: CreateOfferDataType = {
            title: "V",
            company: "Valid Company",
            price: 200,
            fileUrl: "http://example.com/edited-offer.pdf",
        };

        const res = await request(app)
            .put(`/offers/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );
    });

    test("PUT /offers/:offerId - should return 400 for invalid update data - company", async () => {
        const invalidData: CreateOfferDataType = {
            title: "Valid title",
            company: "V",
            price: 200,
            fileUrl: "http://example.com/edited-offer.pdf",
        };

        const res = await request(app)
            .put(`/offers/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );
    });

    test("PUT /offers/:offerId - should return 400 for invalid update data - price", async () => {
        const invalidData: CreateOfferDataType = {
            title: "Valid title",
            company: "Valid Company",
            price: -200,
            fileUrl: "http://example.com/edited-offer.pdf",
        };

        const res = await request(app)
            .put(`/offers/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");
    });

    test("PUT /offers/:offerId - should return 400 for invalid update data - fileUrl", async () => {
        const invalidData: CreateOfferDataType = {
            title: "Valid title",
            company: "Valid Company",
            price: 200,
            fileUrl: "invalid-url",
        };

        const res = await request(app)
            .put(`/offers/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /offers/:offerId - should return 400 for invalid offer ID", async () => {
        const validData: CreateOfferDataType = {
            title: "Valid title",
            company: "Valid Company",
            price: 200,
            fileUrl: "http://example.com/edited-offer.pdf",
        };

        const res = await request(app).put("/offers/invalidId").send(validData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("DELETE /offers/:offerId - should delete offer", async () => {
        mockOffersService.removeAndRemoveFromGCS.mockResolvedValue();

        const res = await request(app).delete(`/offers/${validId}`);
        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(204);
        expect(resBody).toEqual({});
        expect(mockOffersService.removeAndRemoveFromGCS).toHaveBeenCalledWith(
            validId
        );
    });

    test("DELETE /offers/:offerId - should return 400 for invalid offer ID", async () => {
        const res = await request(app).delete("/offers/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /offers/:offerId - should return offer by ID", async () => {
        const mockData = {
            title: "Offer title",
            company: "Some Company",
            price: 100,
            fileUrl: "http://example.com/offer.pdf",
            _id: validId,
            createdAt: new Date(),
        };
        mockOffersService.getById.mockResolvedValue(mockData);

        const res = await request(app).get(`/offers/${validId}`);
        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(mockData);
    });

    test("GET /offers/:offerId - should return 400 for invalid offer ID", async () => {
        const res = await request(app).get("/offers/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /offers/:offerId - should return 500 on service error", async () => {
        mockOffersService.getById.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get(`/offers/${validId}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });

    test("POST /offers/upload - should create a offer with file upload", async () => {
        const newOffer: CreateOfferWithUploadDataType = {
            title: "New offer title",
            company: "Some Company",
            price: 150,
            file: mockFile,
        };
        const createdOffer: OfferResponseType = {
            _id: validId,
            title: newOffer.title,
            company: newOffer.company,
            price: newOffer.price,
            fileUrl: "http://example.com/uploaded-offer.pdf",
            createdAt: new Date(),
        };
        mockOffersService.createWithFile.mockResolvedValue(createdOffer);

        const res = await request(app)
            .post("/offers/upload")
            .field("title", "New offer title")
            .field("company", "Some Company")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(201);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(createdOffer);
        expect(mockOffersService.createWithFile).toHaveBeenCalledWith(
            {
                title: "New offer title",
                company: "Some Company",
                price: 150,
                file: expect.objectContaining({
                    originalname: "test.pdf",
                    mimetype: "application/pdf",
                    buffer: expect.any(Buffer),
                }),
            },
            expect.objectContaining({
                originalname: "test.pdf",
                mimetype: "application/pdf",
            })
        );
    });

    test("POST /offers/upload - should return 400 for invalid data - title", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "T")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );
    });

    test("POST /offers/upload - should return 400 for invalid data - company name", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "Valid title")
            .field("company", "V")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );
    });

    test("POST /offers/upload - should return 400 for invalid data - price", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", -150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");
    });

    test("POST /offers/upload - should return 400 for invalid data - missing file", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");
    });

    test("POST /offers/upload - should return 413 for invalid data - big file", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");
    });

    test("POST /offers/upload - should return 400 for invalid data - wrong file type", async () => {
        const res = await request(app)
            .post("/offers/upload")
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");
    });

    test("POST /offers/upload - should return 500 on service error", async () => {
        mockOffersService.createWithFile.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app)
            .post("/offers/upload")
            .field("title", "New offer title")
            .field("company", "Some Company")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });

    test("PUT /offers/upload/offerId - should edit offer with file upload", async () => {
        const editData: CreateOfferWithUploadDataType = {
            title: "Edited offer title",
            company: "Edited Company",
            price: 200,
            file: mockFile,
        };
        const updatedOffer: OfferResponseType = {
            _id: validId,
            title: editData.title,
            company: editData.company,
            price: editData.price,
            fileUrl: "http://example.com/uploaded-offer.pdf",
            createdAt: new Date(),
        };
        mockOffersService.editWithFile.mockResolvedValue(updatedOffer);

        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Edited offer title")
            .field("company", "Edited Company")
            .field("price", 200)
            .attach("file", mockFile.buffer, "test.pdf");

        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(updatedOffer);
        expect(mockOffersService.editWithFile).toHaveBeenCalledWith(
            validId,
            {
                title: "Edited offer title",
                company: "Edited Company",
                price: 200,
                file: expect.objectContaining({
                    originalname: "test.pdf",
                    mimetype: "application/pdf",
                    buffer: expect.any(Buffer),
                }),
            },
            expect.objectContaining({
                originalname: "test.pdf",
                mimetype: "application/pdf",
            })
        );
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid data - title", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "V")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Offer title should be at least 3 characters long!"
        );
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid data - company name", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Valid title")
            .field("company", "V")
            .field("price", 150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Company name should be at least 2 characters long!"
        );
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid data - price", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", -150)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Price must be a positive number!");
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid data - missing file", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("File is required for upload!");
    });

    test("PUT /offers/upload/offerId - should return 413 for invalid data - big file", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockBigFile.buffer, "test.pdf");

        expect(res.status).toBe(413);
        expect(res.body.message).toBe("File size should not exceed 5MB!");
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid data - wrong file type", async () => {
        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Valid title")
            .field("company", "Valid Company")
            .field("price", 150)
            .attach("file", mockWrongFile.buffer, "test.png");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Only PDF files are allowed!");
    });

    test("PUT /offers/upload/offerId - should return 400 for invalid offer ID", async () => {
        const res = await request(app)
            .put("/offers/upload/invalidId")
            .field("title", "Edited offer title")
            .field("company", "Edited Company")
            .field("price", 200)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("PUT /offers/upload/offerId - should return 500 on service error", async () => {
        mockOffersService.editWithFile.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app)
            .put(`/offers/upload/${validId}`)
            .field("title", "Edited offer title")
            .field("company", "Edited Company")
            .field("price", 200)
            .attach("file", mockFile.buffer, "test.pdf");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });
});
