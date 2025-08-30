import { Router, Request, Response } from "express";

import { InviteServicesTypes } from "../types/ServicesTypes.js";

import { asyncErrorHandler } from "../utils/errorUtils/asyncErrorHandler.js";
import { CustomError } from "../utils/errorUtils/customError.js";

import { createInviteSchema } from "../validators/invite.schema.js";
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
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultId = mongooseIdSchema.safeParse(req.params.inviteId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }
            const invite = await inviteService.getById(resultId.data);
            res.status(200).send(invite);
        })
    );

    return router;
}
