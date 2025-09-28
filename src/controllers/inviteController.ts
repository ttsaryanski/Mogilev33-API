import { Router, Request, Response } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdminMiddleware.js";

import { InviteServicesTypes } from "../types/ServicesTypes.js";

import { asyncErrorHandler } from "../utils/errorUtils/asyncErrorHandler.js";
import { CustomError } from "../utils/errorUtils/customError.js";
import upload from "../utils/upload/multerStorage.js";

import {
    createInviteSchema,
    createInviteWithUploadSchema,
} from "../validators/invite.schema.js";
import { mongooseIdSchema } from "../validators/mongooseId.schema.js";

export function inviteController(inviteService: InviteServicesTypes) {
    const router = Router();

    router.get(
        "/",
        asyncErrorHandler(async (req: Request, res: Response) => {
            const invitations = await inviteService.getAll();
            res.status(200).send(invitations);
        })
    );

    router.post(
        "/",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultData = createInviteSchema.safeParse(req.body);

            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const invite = await inviteService.create(resultData.data);
            res.status(201).send(invite);
        })
    );

    router.put(
        "/:inviteId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.inviteId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            const resultData = createInviteSchema.safeParse(req.body);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const invite = await inviteService.edit(
                resultId.data,
                resultData.data
            );

            res.status(200).send(invite);
        })
    );

    router.delete(
        "/:inviteId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.inviteId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            await inviteService.remove(resultId.data);
            res.sendStatus(204);
        })
    );

    router.get(
        "/:inviteId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultId = mongooseIdSchema.safeParse(req.params.inviteId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }
            const invite = await inviteService.getById(resultId.data);
            res.status(200).send(invite);
        })
    );

    router.post(
        "/upload",
        authMiddleware,
        isAdmin,
        upload.single("file"),
        asyncErrorHandler(async (req, res) => {
            const file = req.file;
            if (!file) {
                throw new CustomError("File is required for upload", 400);
            }
            const data = {
                ...req.body,
                file: file,
            };

            const resultData = createInviteWithUploadSchema.safeParse(data);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const invite = await inviteService.createWithFile(data, file);
            res.status(201).send(invite);
        })
    );

    router.put(
        "/upload/:inviteId",
        authMiddleware,
        isAdmin,
        upload.single("file"),
        asyncErrorHandler(async (req, res) => {
            const file = req.file;
            if (!file) {
                throw new CustomError("File is required for upload", 400);
            }
            const data = {
                ...req.body,
                file: file,
            };

            const resultId = mongooseIdSchema.safeParse(req.params.inviteId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            const resultData = createInviteWithUploadSchema.safeParse(data);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const invite = await inviteService.editWithFile(
                resultId.data,
                data,
                file
            );

            res.status(200).send(invite);
        })
    );

    return router;
}
