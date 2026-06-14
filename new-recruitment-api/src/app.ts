import express from "express";
import { CandidatesController } from "./candidates/candidates.controller";

export const setupApp = async () => {
    const app = express();

    app.use(express.json());

    app.use(new CandidatesController().router);

    return app;
}
