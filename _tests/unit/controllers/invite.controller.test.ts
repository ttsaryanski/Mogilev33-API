import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import mongoose from "mongoose";

import { inviteController } from "../../../src/controllers/inviteController.js";

import errorHandler from "../../../src/middlewares/errorHandler.js";

import { InviteServicesTypes } from "../../../src/types/ServicesTypes.js";
import { InviteResponseType } from "../../../src/types/InviteTypes.js";
import { CreateInviteDataType } from "../../../src/validators/invite.schema.js";

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

const mockInvitesService: jest.Mocked<InviteServicesTypes> = {
    getAll: jest.fn(),
    create: jest.fn(),
    createWithFile: jest.fn(),
    edit: jest.fn(),
    editWithFile: jest.fn(),
    remove: jest.fn(),
    removeAndRemoveFromGCS: jest.fn(),
    getById: jest.fn(),
};

const app = express();
app.use(express.json());
app.use("/invitations", inviteController(mockInvitesService));
app.use(errorHandler);

describe("Invites Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /invitations - should return all invites", async () => {
        const mockData = [
            {
                title: "New invite",
                date: "2023/12/31",
                fileUrl: "http://example.com/invite.pdf",
                _id: validId,
                createdAt: new Date(),
            },
        ];
        mockInvitesService.getAll.mockResolvedValue(mockData);

        const res = await request(app).get("/invitations");
        const resBody = res.body as InviteResponseType[];

        expect(res.status).toBe(200);
        expect([
            {
                ...resBody[0],
                createdAt: new Date(resBody[0].createdAt),
            },
        ]).toEqual(mockData);
    });

    test("GET /invitations - should return 500 on service error", async () => {
        mockInvitesService.getAll.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get("/invitations");

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });

    test("POST /invitations - should create a invite", async () => {
        const newInvite: CreateInviteDataType = {
            title: "New note",
            date: "2023/12/31",
            fileUrl: "http://example.com/invite.pdf",
        };
        const createdInvite: InviteResponseType = {
            ...newInvite,
            _id: validId,
            createdAt: new Date(),
        };
        mockInvitesService.create.mockResolvedValue(createdInvite);

        const res = await request(app).post("/invitations").send(newInvite);
        const resBody = res.body as InviteResponseType;

        expect(res.status).toBe(201);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(createdInvite);
        expect(mockInvitesService.create).toHaveBeenCalledWith(newInvite);
    });

    test("POST /invitations - should return 400 for invalid data - title", async () => {
        const invalidData = {
            title: "T",
            date: "2023/12/31",
            fileUrl: "http://example.com/invite.pdf",
        };

        const res = await request(app).post("/invitations").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invite title should be at least 3 characters long!"
        );
    });

    test("POST /invitations - should return 400 for invalid data - date", async () => {
        const invalidData = {
            title: "Valid title",
            date: "31-12-2023",
            fileUrl: "http://example.com/invite.pdf",
        };

        const res = await request(app).post("/invitations").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );
    });

    test("POST /invitations - should return 400 for invalid data - fileUrl", async () => {
        const invalidData = {
            title: "Valid title",
            date: "2023/12/31",
            fileUrl: "invalid-url",
        };

        const res = await request(app).post("/invitations").send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /invitations/:inviteId - should edit invite", async () => {
        const editData: CreateInviteDataType = {
            title: "Edited invite title",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-invite.pdf",
        };
        const updatedInvite: InviteResponseType = {
            ...editData,
            _id: validId,
            createdAt: new Date(),
        };
        mockInvitesService.edit.mockResolvedValue(updatedInvite);

        const res = await request(app)
            .put(`/invitations/${validId}`)
            .send(editData);
        const resBody = res.body as InviteResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(updatedInvite);
        expect(mockInvitesService.edit).toHaveBeenCalledWith(validId, editData);
    });

    test("PUT /invitations/:inviteId - should return 400 for invalid update data - title", async () => {
        const invalidData: CreateInviteDataType = {
            title: "T",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-invite.pdf",
        };

        const res = await request(app)
            .put(`/invitations/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invite title should be at least 3 characters long!"
        );
    });

    test("PUT /invitations/:inviteId - should return 400 for invalid update data - date", async () => {
        const invalidData: CreateInviteDataType = {
            title: "Valid title",
            date: "15-01-2024",
            fileUrl: "http://example.com/edited-invite.pdf",
        };

        const res = await request(app)
            .put(`/invitations/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!"
        );
    });

    test("PUT /invitations/:inviteId - should return 400 for invalid update data - fileUrl", async () => {
        const invalidData: CreateInviteDataType = {
            title: "Valid title",
            date: "2024/01/15",
            fileUrl: "invalid-url",
        };

        const res = await request(app)
            .put(`/invitations/${validId}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid file URL!");
    });

    test("PUT /invitations/:inviteId - should return 400 for invalid invite ID", async () => {
        const validData: CreateInviteDataType = {
            title: "Valid title",
            date: "2024/01/15",
            fileUrl: "http://example.com/edited-invite.pdf",
        };

        const res = await request(app)
            .put("/invitations/invalidId")
            .send(validData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("DELETE /invitations/:inviteId - should delete note", async () => {
        mockInvitesService.remove.mockResolvedValue();

        const res = await request(app).delete(`/invitations/${validId}`);
        const resBody = res.body as InviteResponseType;

        expect(res.status).toBe(204);
        expect(resBody).toEqual({});
        expect(mockInvitesService.removeAndRemoveFromGCS).toHaveBeenCalledWith(
            validId
        );
    });

    test("DELETE /invitations/:inviteId - should return 400 for invalid invite ID", async () => {
        const res = await request(app).delete("/invitations/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /invitations/:inviteId - should return invite by ID", async () => {
        const mockData = {
            title: "New invite",
            date: "2023/12/31",
            fileUrl: "http://example.com/invite.pdf",
            _id: validId,
            createdAt: new Date(),
        };
        mockInvitesService.getById.mockResolvedValue(mockData);

        const res = await request(app).get(`/invitations/${validId}`);
        const resBody = res.body as InviteResponseType;

        expect(res.status).toBe(200);
        expect({
            ...resBody,
            createdAt: new Date(resBody.createdAt),
        }).toEqual(mockData);
    });

    test("GET /invitations/:inviteId - should return 400 for invalid invite ID", async () => {
        const res = await request(app).get("/invitations/invalidId");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
            "Id must be a valid MongooseDB ObjectId!"
        );
    });

    test("GET /invitations/:inviteId - should return 500 on service error", async () => {
        mockInvitesService.getById.mockRejectedValue(
            new Error("Service failure!")
        );

        const res = await request(app).get(`/invitations/${validId}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Service failure!");
    });
});
