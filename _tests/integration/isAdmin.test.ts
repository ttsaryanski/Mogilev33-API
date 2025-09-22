import request from "supertest";

import * as jwt from "../../src/lib/jwt.js";
import app from "../../src/app";

import { InvalidToken } from "../../src/models/InvalidToken.js";
import { User } from "../../src/models/User.js";

import { Offer } from "../../src/models/Offer.js";
import { CreateOfferDataType } from "../../src/validators/offer.schema";
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

describe("isAdmin Middleware Integration", () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await Offer.deleteMany();
    });

    it("should create new offer and return 201", async () => {
        const validPayload = {
            _id: "507f1f77bcf86cd799439011",
            email: "test@example.com",
            role: "admin",
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
        const createData: CreateOfferDataType = {
            title: "Test title",
            company: "Test company name",
            price: 100,
            fileUrl: "https://example.com/offer.pdf",
        };
        const res = await request(app)
            .post("/api/offers")
            .send(createData)
            .set("Cookie", [`refreshToken=${validToken}`]);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Test title");
        expect(res.body.company).toBe("Test company name");
        expect(res.body.price).toBe(100);
        expect(res.body.fileUrl).toBe("https://example.com/offer.pdf");

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).not.toBeNull();
    });

    it("should return 403 if user not admin", async () => {
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
        const createData: CreateOfferDataType = {
            title: "Test title",
            company: "Test company name",
            price: 100,
            fileUrl: "https://example.com/offer.pdf",
        };
        const res = await request(app)
            .post("/api/offers")
            .send(createData)
            .set("Cookie", [`refreshToken=${validToken}`]);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe("Admin access required!");

        const dbEntry = await Offer.findOne({ title: "Test title" });
        expect(dbEntry).toBeNull();
    });
});
