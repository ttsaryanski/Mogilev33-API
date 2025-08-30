import { Offer } from "../models/Offer.js";

import { OfferServicesTypes } from "../types/ServicesTypes.js";
import { OfferResponseType } from "../types/OfferTypes.js";
import { CreateOfferDataType } from "../validators/offer.schema.js";

import { CustomError } from "../utils/errorUtils/customError.js";

export const offerService: OfferServicesTypes = {
    async getAll(): Promise<OfferResponseType[]> {
        const offers = await Offer.find().select("-__v").lean();

        return offers.map((offer) => ({
            _id: offer._id.toString(),
            title: offer.title,
            company: offer.company,
            price: offer.price,
            fileUrl: offer.fileUrl,
            createdAt: offer.createdAt,
        }));
    },

    async create(data: CreateOfferDataType): Promise<OfferResponseType> {
        const newOffer = (await Offer.create(data)) as OfferResponseType;
        return {
            _id: newOffer._id.toString(),
            title: newOffer.title,
            company: newOffer.company,
            price: newOffer.price,
            fileUrl: newOffer.fileUrl,
            createdAt: newOffer.createdAt,
        };
    },

    async edit(
        offerId: string,
        data: CreateOfferDataType
    ): Promise<OfferResponseType> {
        const updatedOffer = (await Offer.findByIdAndUpdate(offerId, data, {
            runValidators: true,
            new: true,
        })) as OfferResponseType;

        if (!updatedOffer) {
            throw new CustomError("Offer not found!", 404);
        }
        return {
            _id: updatedOffer._id.toString(),
            title: updatedOffer.title,
            company: updatedOffer.company,
            price: updatedOffer.price,
            fileUrl: updatedOffer.fileUrl,
            createdAt: updatedOffer.createdAt,
        };
    },

    async remove(offerId: string): Promise<void> {
        const result = await Offer.findByIdAndDelete(offerId);

        if (!result) {
            throw new CustomError("Offer not found!", 404);
        }
    },

    async getById(offerId: string): Promise<OfferResponseType> {
        const offer = (await Offer.findById(offerId)) as OfferResponseType;

        if (!offer) {
            throw new CustomError("Offer not found!", 404);
        }

        return {
            _id: offer._id.toString(),
            title: offer.title,
            company: offer.company,
            price: offer.price,
            fileUrl: offer.fileUrl,
            createdAt: offer.createdAt,
        };
    },
};
