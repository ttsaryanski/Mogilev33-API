import { z } from "zod";

import { uploadConfig } from "../utils/upload/uploadConfig.js";

export const createProtocolSchema = z.object({
    title: z
        .string()
        .min(3, "Protocol title should be at least 3 characters long!")
        .trim(),
    date: z.string().refine(
        (value) => {
            const dateRegex = /^(\d{4})\/(\d{2})\/(\d{2})$/;
            if (!dateRegex.test(value)) return false;

            const [, year, month, day] = value.match(dateRegex)!.map(Number);
            const date = new Date(year, month - 1, day);
            return (
                date.getDate() === day &&
                date.getMonth() === month - 1 &&
                date.getFullYear() === year &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            );
        },
        {
            message:
                "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!",
        }
    ),
    fileUrl: z.string().url("Invalid file URL!"),
});
export type CreateProtocolDataType = z.infer<typeof createProtocolSchema>;

export const createProtocolWithUploadSchema = z.object({
    title: z
        .string()
        .min(3, "Protocol title should be at least 3 characters long!")
        .trim(),
    date: z.string().refine(
        (value) => {
            const dateRegex = /^(\d{4})\/(\d{2})\/(\d{2})$/;
            if (!dateRegex.test(value)) return false;

            const [, year, month, day] = value.match(dateRegex)!.map(Number);
            const date = new Date(year, month - 1, day);
            return (
                date.getDate() === day &&
                date.getMonth() === month - 1 &&
                date.getFullYear() === year &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            );
        },
        {
            message:
                "Invalid date format. Expected YYYY/MM/DD (e.g. 2025/03/28)!",
        }
    ),
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
export type CreateProtocolWithUploadDataType = z.infer<
    typeof createProtocolWithUploadSchema
>;
