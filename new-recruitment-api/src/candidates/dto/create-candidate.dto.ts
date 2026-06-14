import { z } from "zod";

export const createCandidateSchema = z
    .object({
        firstName: z
            .string()
            .trim()
            .min(1, "First name is required")
            .max(100),

        lastName: z
            .string()
            .trim()
            .min(1, "Last name is required")
            .max(100),

        email: z
            .email("Invalid email format")
            .trim()
            .transform((email) => email.toLowerCase()),

        phone: z
            .string()
            .trim()
            .min(1, "Phone number is required")
            .max(50),

        yearsOfExperience: z
            .number()
            .int()
            .min(0)
            .max(100),

        recruiterNotes: z
            .string()
            .trim()
            .max(5000),

        status: z.enum([
            "new",
            "in_progress",
            "accepted",
            "rejected",
        ]),

        consentDate: z
            .string()
            .trim()
            .refine(
                (value) => !Number.isNaN(Date.parse(value)),
                "Consent date must be a valid date",
            )
            .transform((value) =>
                new Date(value).toISOString(),
            ),

        jobOfferIds: z
            .array(
                z
                .number()
                .int()
                .positive(),
            )
            .min(
                1,
                "Candidate must be assigned to at least one job offer",
            )
            .refine(
                (ids) => new Set(ids).size === ids.length,
                "jobOfferIds cannot contain duplicates",
            ),
    })
    .strict();

export type CreateCandidateDto =
    z.infer<typeof createCandidateSchema>;