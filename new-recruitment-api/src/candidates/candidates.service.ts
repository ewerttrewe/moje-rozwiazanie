import createHttpError from "http-errors";
import type { CreateCandidateDto } from "./dto/create-candidate.dto";
import type { ListCandidatesQueryDto} from "./dto/list-candidates.dto";
import { CandidatesRepository } from "./candidates.repository";
import type { LegacyCandidatesGateway} from "../legacy/legacy-candidates.client";

export class CandidatesService {
    constructor(
        private readonly candidatesRepository: CandidatesRepository,
        private readonly legacyCandidatesGateway: LegacyCandidatesGateway,
    ) {}

    async create(input: CreateCandidateDto) {
        const candidateExists = await this.candidatesRepository.existsByEmail(input.email);

        if (candidateExists) {
            throw createHttpError(
                409,
                "Candidate with this email already exists",
            );
        }

        const existingJobOfferIds = await this.candidatesRepository.findExistingJobOfferIds(input.jobOfferIds);

        const existingJobOfferIdSet = new Set(existingJobOfferIds);
        const missingJobOfferIds = input.jobOfferIds.filter((jobOfferId) =>
            !existingJobOfferIdSet.has(jobOfferId)
        );

        if (missingJobOfferIds.length > 0) {
            throw createHttpError(
                400,
                "Some selected job offers do not exist",
                {
                    details: {
                        missingJobOfferIds,
                    },
                },
            );
        }

        try {
            return await this.candidatesRepository.runInTransaction(async () => {
                    const candidate = await this.candidatesRepository.create(input);

                    await this.legacyCandidatesGateway.createCandidate({
                            firstName: input.firstName,
                            lastName: input.lastName,
                            email: input.email,
                        });

                    return candidate;
                });
        } catch (error) {
            throw error;
        }
    }

    async getAll(query: ListCandidatesQueryDto) {
        return this.candidatesRepository.findPaginated(query);
    }
}