import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from "express";
import createHttpError from "http-errors";

interface HttpErrorWithDetails extends Error {
    status?: number;
    statusCode?: number;
    details?: unknown;
}

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (createHttpError.isHttpError(error)) {
        const httpError = error as HttpErrorWithDetails;

        const statusCode =
            httpError.statusCode ??
            httpError.status ??
            500;

        res.status(statusCode).json({
            message: httpError.message,

            ...(
                httpError.details !== undefined
                ? { details: httpError.details }
                : {}
            ),
        });

        return;
    }

    console.error(error);

    res.status(500).json({ message: "Internal server error" });
};