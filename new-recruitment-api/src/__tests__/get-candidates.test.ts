import type { Application } from "express";
import request from "supertest";
import type { Database } from "sqlite";

import { setupApp } from "../app";
import { setupDb } from "../db";
import type { CreateCandidateDto } from "../candidates/dto/create-candidate.dto";
import type { LegacyCandidatesGateway } from "../legacy/legacy-candidates.client";

describe("GET /candidates", () => {
    let app: Application;
    let db: Database;
    const legacyCandidatesGateway: LegacyCandidatesGateway = {
        createCandidate: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        db = await setupDb();
        app = setupApp(db, legacyCandidatesGateway);
    });

    afterEach(async () => {
        await db.close();
    });

    it("should return one candidate with pagination", async () => {
        const candidate: CreateCandidateDto = {
            firstName: "Jan",
            lastName: "Kowalski",
            email: "jan.get@example.com",
            phone: "123-456-789",
            yearsOfExperience: 4,
            recruiterNotes: "Backend candidate",
            status: "new",
            consentDate: "2026-06-14T10:00:00.000Z",
            jobOfferIds: [1],
        };

        const result = await db.run(
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
            candidate.firstName,
            candidate.lastName,
            candidate.email,
            candidate.phone,
            candidate.yearsOfExperience,
            candidate.recruiterNotes,
            candidate.status,
            candidate.consentDate,
        );

        const candidateId = result.lastID;

        if (!candidateId) {
            throw new Error("Test candidate was created without an ID");
        }

        await db.run(
            `
                INSERT INTO CandidateJobOffer (
                    candidate_id,
                    job_offer_id
                )
                VALUES (?, ?)
            `,
            candidateId,
            candidate.jobOfferIds[0],
        );

        const response = await request(app)
            .get("/candidates?page=1&limit=20")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
        });

        expect(response.body.items).toHaveLength(1);

        expect(response.body.items[0]).toMatchObject({
            id: candidateId,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone,
            yearsOfExperience:
            candidate.yearsOfExperience,
            recruiterNotes:
            candidate.recruiterNotes,
            status: candidate.status,
            jobOfferIds: [1],
        });
    });

    it("should return an empty paginated result when no candidates exist", async () => {
        const response = await request(app)
            .get("/candidates")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({
            items: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
        });
    });

    it("should reject invalid pagination parameters", async () => {
        const response = await request(app)
            .get("/candidates?page=0&limit=101")
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body.message).toBe(
            "Query validation failed",
        );
    });
});