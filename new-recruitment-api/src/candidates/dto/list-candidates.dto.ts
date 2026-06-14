import { z } from "zod";

export const listCandidatesQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .positive()
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(5),

    jobOfferId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),
});

export type ListCandidatesQueryDto =
    z.infer<typeof listCandidatesQuerySchema>;