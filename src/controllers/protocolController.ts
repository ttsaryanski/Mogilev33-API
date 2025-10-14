import { Router, Request, Response } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdminMiddleware.js";

import { ProtocolServicesTypes } from "../types/ServicesTypes.js";

import { asyncErrorHandler } from "../utils/errorUtils/asyncErrorHandler.js";
import { CustomError } from "../utils/errorUtils/customError.js";
import upload from "../utils/upload/multerStorage.js";

import {
    createProtocolSchema,
    createProtocolWithUploadSchema,
} from "../validators/protocol.schema.js";
import { mongooseIdSchema } from "../validators/mongooseId.schema.js";

export function protocolController(protocolService: ProtocolServicesTypes) {
    const router = Router();

    router.get(
        "/",
        asyncErrorHandler(async (req: Request, res: Response) => {
            const protocols = await protocolService.getAll();
            res.status(200).send(protocols);
        })
    );

    router.post(
        "/",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultData = createProtocolSchema.safeParse(req.body);

            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const protocol = await protocolService.create(resultData.data);
            res.status(201).send(protocol);
        })
    );

    router.put(
        "/:protocolId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.protocolId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            const resultData = createProtocolSchema.safeParse(req.body);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const protocol = await protocolService.edit(
                resultId.data,
                resultData.data
            );

            res.status(200).send(protocol);
        })
    );

    router.delete(
        "/:protocolId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.protocolId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            await protocolService.removeAndRemoveFromGCS(resultId.data);
            res.sendStatus(204);
        })
    );

    router.get(
        "/:protocolId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultId = mongooseIdSchema.safeParse(req.params.protocolId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }
            const protocol = await protocolService.getById(resultId.data);
            res.status(200).send(protocol);
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
                throw new CustomError("File is required for upload!", 400);
            }
            const data = {
                ...req.body,
                file: file,
            };

            const resultData = createProtocolWithUploadSchema.safeParse(data);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const protocol = await protocolService.createWithFile(data, file);
            res.status(201).send(protocol);
        })
    );

    router.put(
        "/upload/:protocolId",
        authMiddleware,
        isAdmin,
        upload.single("file"),
        asyncErrorHandler(async (req, res) => {
            const file = req.file;
            if (!file) {
                throw new CustomError("File is required for upload!", 400);
            }
            const data = {
                ...req.body,
                file: file,
            };

            const resultId = mongooseIdSchema.safeParse(req.params.protocolId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            const resultData = createProtocolWithUploadSchema.safeParse(data);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const protocol = await protocolService.editWithFile(
                resultId.data,
                data,
                file
            );

            res.status(200).send(protocol);
        })
    );

    return router;
}
