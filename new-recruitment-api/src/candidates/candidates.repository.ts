import type { Database } from "sqlite";
import type { CreateCandidateDto } from "./dto/create-candidate.dto";
import type {
    Candidate,
    CandidateStatus,
} from "./types/candidate.types";

interface CandidateRow {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    yearsOfExperience: number;
    recruiterNotes: string;
    status: CandidateStatus;
    consentDate: string;
    createdAt: string;
    jobOfferIds: string | null;
}

export class CandidatesRepository {
    constructor(
        private readonly db: Database,
    ) {}

    async runInTransaction<T>(operation: () => Promise<T>) {
        await this.db.exec("BEGIN IMMEDIATE");
        try {
            const result = await operation();
            await this.db.exec("COMMIT");

            return result;
        } catch (error) {
            await this.db.exec("ROLLBACK");

            throw error;
        }
    }

    async existsByEmail(email: string) {
        const row = await this.db.get<{
            id: number;
        }>(
            `
                SELECT id
                FROM Candidate
                WHERE email = ?
            `,
            email,
        );

        return row !== undefined;
    }

    async findExistingJobOfferIds(
        jobOfferIds: number[],
    ) {
        if (jobOfferIds.length === 0) {
            return [];
        }

        const placeholders = jobOfferIds
            .map(() => "?")
            .join(", ");

        const rows = await this.db.all<
            Array<{ id: number }>
        >(
            `
                SELECT id
                FROM JobOffer
                WHERE id IN (${placeholders})
            `,
            ...jobOfferIds,
        );

        return rows.map((row) => row.id);
    }

    async create(
        input: CreateCandidateDto,
    ): Promise<Candidate> {
        const result = await this.db.run(
            `
                INSERT INTO Candidate (
                    first_name,
                    last_name,
                    email,
                    phone,
                    years_of_experience,
                    recruiter_notes,
                    status,
                    consent_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            input.firstName,
            input.lastName,
            input.email,
            input.phone,
            input.yearsOfExperience,
            input.recruiterNotes,
            input.status,
            input.consentDate,
        );

        const candidateId = result.lastID;

        if (!candidateId) {
            throw new Error("Candidate was created without an ID");
        }

        for (const jobOfferId of input.jobOfferIds) {
            await this.db.run(
                `
                    INSERT INTO CandidateJobOffer (
                        candidate_id,
                        job_offer_id
                    )
                    VALUES (?, ?)
                `,
                candidateId,
                jobOfferId,
            );
        }

        const candidate = await this.findById(candidateId);

        if (!candidate) {
            throw new Error("Created candidate could not be retrieved");
        }

        return candidate;
    }

    async findById(candidateId: number) {
        const row =
            await this.db.get<CandidateRow>(
                `
                    SELECT
                        candidate.id,

                        candidate.first_name
                            AS firstName,

                        candidate.last_name
                            AS lastName,

                        candidate.email,
                        candidate.phone,

                        candidate.years_of_experience
                            AS yearsOfExperience,

                        candidate.recruiter_notes
                            AS recruiterNotes,

                        candidate.status,

                        candidate.consent_date
                            AS consentDate,

                        candidate.created_at
                            AS createdAt,

                        GROUP_CONCAT(
                            relation.job_offer_id
                        ) AS jobOfferIds

                    FROM Candidate candidate

                    LEFT JOIN CandidateJobOffer relation
                        ON relation.candidate_id =
                            candidate.id

                    WHERE candidate.id = ?

                    GROUP BY candidate.id
                `,
                candidateId,
            );

        if (!row) return undefined;

        return this.mapCandidateRow(row);
    }

    async findPaginated(options: {
        page: number;
        limit: number;
        jobOfferId?: number;
    }) {
        const {
            page,
            limit,
            jobOfferId,
        } = options;

        const offset = (page - 1) * limit;
        const selectedJobOfferId = jobOfferId ?? null;
        const countResult = await this.db.get<{
            total: number;
        }>(
            `
                SELECT COUNT(*) AS total
                FROM Candidate candidate

                WHERE (
                    ? IS NULL
                    OR EXISTS (
                        SELECT 1
                        FROM CandidateJobOffer relation

                        WHERE
                            relation.candidate_id =
                                candidate.id

                            AND relation.job_offer_id = ?
                    )
                )
            `,
            selectedJobOfferId,
            selectedJobOfferId,
        );

        const rows =
            await this.db.all<CandidateRow[]>(
                `
                    SELECT
                        candidate.id,
                        candidate.first_name AS firstName,
                        candidate.last_name AS lastName,
                        candidate.email,
                        candidate.phone,
                        candidate.years_of_experience AS yearsOfExperience,
                        candidate.recruiter_notes AS recruiterNotes,
                        candidate.status,
                        candidate.consent_date AS consentDate,
                        candidate.created_at AS createdAt,
                        GROUP_CONCAT(relation.job_offer_id) AS jobOfferIds

                    FROM Candidate candidate

                    LEFT JOIN CandidateJobOffer relation
                        ON relation.candidate_id =
                            candidate.id

                    WHERE (
                        ? IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM CandidateJobOffer filter_relation

                            WHERE
                                filter_relation.candidate_id =
                                    candidate.id

                                AND filter_relation.job_offer_id = ?
                        )
                    )

                    GROUP BY candidate.id
                    ORDER BY candidate.id DESC
                    LIMIT ?
                    OFFSET ?
                `,
                selectedJobOfferId,
                selectedJobOfferId,
                limit,
                offset,
            );

        const total = countResult?.total ?? 0;

        return {
            items: rows.map((row) => this.mapCandidateRow(row)),
            pagination: {
                page,
                limit,
                total,
                totalPages:
                    Math.ceil(total / limit),
            },
        };
    }

    private mapCandidateRow(row: CandidateRow) {
        return {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            yearsOfExperience:
            row.yearsOfExperience,
            recruiterNotes:
            row.recruiterNotes,
            status: row.status,
            consentDate: row.consentDate,
            createdAt: row.createdAt,
            jobOfferIds: row.jobOfferIds
                ? row.jobOfferIds
                    .split(",")
                    .map(Number)
                    .sort((first, second) =>
                        first - second,
                    )
                : [],
        };
    }
}