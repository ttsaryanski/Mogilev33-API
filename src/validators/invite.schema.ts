import { z } from "zod";

export const createInviteSchema = z.object({
    title: z
        .string()
        .min(3, "Invite title should be at least 3 characters long!")
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

export type CreateInviteDataType = z.infer<typeof createInviteSchema>;
