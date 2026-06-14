import type { RequestHandler } from "express";
import createHttpError = require("http-errors");

export const notFoundHandler: RequestHandler = (
    req,
    _res,
    next,
): void => {
    next(
        createHttpError(
            404,
            `Route: ${req.method} ${req.originalUrl} was not found`,
        ),
    );
};