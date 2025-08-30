import { z } from "zod";

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
