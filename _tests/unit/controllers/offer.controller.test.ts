import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import mongoose from "mongoose";

import { offerController } from "../../../src/controllers/offerController.js";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { OfferServicesTypes } from "../../../src/types/ServicesTypes.js";
import { OfferResponseType } from "../../../src/types/OfferTypes.js";
import { CreateOfferDataType } from "../../../src/validators/offer.schema.js";

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
    edit: jest.fn(),
    remove: jest.fn(),
    getById: jest.fn(),
};

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
            title: "T",
            company: "Some Company",
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
            company: "S",
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
            company: "Some Company",
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
            company: "Some Company",
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
            title: "T",
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
            company: "C",
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
        mockOffersService.remove.mockResolvedValue();

        const res = await request(app).delete(`/offers/${validId}`);
        const resBody = res.body as OfferResponseType;

        expect(res.status).toBe(204);
        expect(resBody).toEqual({});
        expect(mockOffersService.remove).toHaveBeenCalledWith(validId);
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
            title: "New offer",
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
});
