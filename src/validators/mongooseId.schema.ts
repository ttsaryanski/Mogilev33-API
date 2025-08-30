import { z } from "zod";

export const mongooseIdSchema = z.string().refine(
    (val) => {
        return /^[a-fA-F0-9]{24}$/.test(val);
    },
    {
        message: "Id must be a valid MongooseDB ObjectId!",
    }
);

export type MongooseIdType = z.infer<typeof mongooseIdSchema>;
