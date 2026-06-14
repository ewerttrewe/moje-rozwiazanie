import type { Request, Response } from "express";
import { Router } from "express";
import { CandidatesService } from "./candidates.service";
import { createCandidateSchema, CreateCandidateDto } from "./dto/create-candidate.dto";
import { listCandidatesQuerySchema, ListCandidatesQueryDto } from "./dto/list-candidates.dto";
import { validateBody, validateQuery } from "../middlewares/candidate-validation.middleware";

export class CandidatesController {
    readonly router = Router();

    constructor(
        private readonly candidatesService: CandidatesService,
    ) {
        this.router.get("/", validateQuery(listCandidatesQuerySchema), this.getAll);
        this.router.post("/", validateBody(createCandidateSchema), this.create);
    }

    private readonly getAll = async (_req: Request, res: Response) => {
        const query = res.locals.validatedQuery as ListCandidatesQueryDto;
        const result = await this.candidatesService.getAll(query);

        res.status(200).json(result);
    };

    private readonly create = async (_req: Request, res: Response) => {
        const input = res.locals.validatedBody as CreateCandidateDto;
        const candidate = await this.candidatesService.create(input);

        res.status(201).json({message: "Candidate created successfully", candidate});
    };
}