import { z } from "zod";

import { uploadConfig } from "../utils/upload/uploadConfig.js";

export const createOfferSchema = z.object({
    title: z
        .string()
        .min(3, "Offer title should be at least 3 characters long!")
        .trim(),
    company: z
        .string()
        .min(2, "Company name should be at least 2 characters long!")
        .trim(),
    price: z.number().min(0, "Price must be a positive number!"),
    fileUrl: z.string().url("Invalid file URL!"),
});
export type CreateOfferDataType = z.infer<typeof createOfferSchema>;

export const createOfferWithUploadSchema = z.object({
    title: z
        .string()
        .min(3, "Offer title should be at least 3 characters long!")
        .trim(),
    company: z
        .string()
        .min(2, "Company name should be at least 2 characters long!")
        .trim(),
    price: z.number().min(0, "Price must be a positive number!"),
    file: z.object({
        mimetype: z.enum(
            uploadConfig.allowedMimeTypes as [string, ...string[]]
        ),
        size: z.number().max(uploadConfig.maxFileSize, {
            message: `File size should not exceed ${uploadConfig.maxFileSize / 1024 / 1024}MB!`,
        }),
        buffer: z.instanceof(Buffer),
        originalname: z.string(),
    }),
});
export type CreateOfferWithUploadDataType = z.infer<
    typeof createOfferWithUploadSchema
>;
