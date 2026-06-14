import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import createHttpError from "http-errors";

export const validateBody = (
    schema: ZodType,
): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(
                createHttpError(
                    400,
                    "Request body validation failed",
                    { details: result.error.issues },
                ),
            );

            return;
        }

        res.locals.validatedBody = result.data;
        next();
    };
};

export const validateQuery = (
    schema: ZodType,
): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(
                createHttpError(
                    400,
                    "Query validation failed",
                    {
                        details: result.error.issues,
                    },
                ),
            );

            return;
        }

        res.locals.validatedQuery = result.data;
        next();
    };
};