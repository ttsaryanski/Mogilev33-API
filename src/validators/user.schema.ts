import { z } from "zod";

export const createUserSchema = z.object({
    email: z.string().email("Invalid email format!").trim(),
    password: z
        .string()
        .min(6, "Password should be at least 6 characters long!"),
});

export type CreateUserDataType = z.infer<typeof createUserSchema>;
