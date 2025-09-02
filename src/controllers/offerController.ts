import { Router, Request, Response } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdminMiddleware.js";

import { OfferServicesTypes } from "../types/ServicesTypes.js";

import { asyncErrorHandler } from "../utils/errorUtils/asyncErrorHandler.js";
import { CustomError } from "../utils/errorUtils/customError.js";

import { createOfferSchema } from "../validators/offer.schema.js";
import { mongooseIdSchema } from "../validators/mongooseId.schema.js";

export function offerController(offerService: OfferServicesTypes) {
    const router = Router();

    router.get(
        "/",
        asyncErrorHandler(async (req: Request, res: Response) => {
            const offers = await offerService.getAll();
            res.status(200).send(offers);
        })
    );

    router.post(
        "/",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultData = createOfferSchema.safeParse(req.body);

            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const offer = await offerService.create(resultData.data);
            res.status(201).send(offer);
        })
    );

    router.put(
        "/:offerId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.offerId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            const resultData = createOfferSchema.safeParse(req.body);
            if (!resultData.success) {
                throw new CustomError(resultData.error.issues[0].message, 400);
            }

            const offer = await offerService.edit(
                resultId.data,
                resultData.data
            );

            res.status(200).send(offer);
        })
    );

    router.delete(
        "/:offerId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req, res) => {
            const resultId = mongooseIdSchema.safeParse(req.params.offerId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }

            await offerService.remove(resultId.data);
            res.sendStatus(204);
        })
    );

    router.get(
        "/:offerId",
        authMiddleware,
        isAdmin,
        asyncErrorHandler(async (req: Request, res: Response) => {
            const resultId = mongooseIdSchema.safeParse(req.params.offerId);
            if (!resultId.success) {
                throw new CustomError(resultId.error.issues[0].message, 400);
            }
            const offer = await offerService.getById(resultId.data);
            res.status(200).send(offer);
        })
    );

    return router;
}
