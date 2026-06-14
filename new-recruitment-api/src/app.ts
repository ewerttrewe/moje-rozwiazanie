import express from "express";
import type { Database } from "sqlite";
import { CandidatesController } from "./candidates/candidates.controller";
import { CandidatesRepository } from "./candidates/candidates.repository";
import { CandidatesService } from "./candidates/candidates.service";
import { errorHandler } from "./exceptions/error-handler.middleware";
import { notFoundHandler } from "./exceptions/not-found.middleware";
import type { LegacyCandidatesGateway} from "./legacy/legacy-candidates.client";

export const setupApp = (
    db: Database,
    legacyCandidatesGateway:
    LegacyCandidatesGateway,
) => {
    const app = express();

    app.use(express.json({ limit: "5mb" }));

    const candidatesRepository =
        new CandidatesRepository(db);

    const candidatesService =
        new CandidatesService(candidatesRepository, legacyCandidatesGateway);

    const candidatesController = new CandidatesController(candidatesService);

    app.get("/", (_req, res) => {
        res.status(200).send(
            "New Recruitment API",
        );
    });

    app.use("/candidates", candidatesController.router);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};