import type { Application } from "express";
import request from "supertest";
import type { Database } from "sqlite";
import createHttpError = require("http-errors");

import { setupApp } from "../app";
import { setupDb } from "../db";
import type { CreateCandidateDto } from "../candidates/dto/create-candidate.dto";
import type {
    LegacyCandidatePayload,
    LegacyCandidatesGateway,
} from "../legacy/legacy-candidates.client";

describe("POST /candidates", () => {
    let app: Application;
    let db: Database;

    const createLegacyCandidateMock = jest.fn<
        Promise<void>,
        [LegacyCandidatePayload]
    >();

    beforeEach(async () => {
        db = await setupDb();

        createLegacyCandidateMock.mockReset();
        createLegacyCandidateMock.mockResolvedValue(undefined);

        const legacyCandidatesGateway: LegacyCandidatesGateway = {createCandidate: createLegacyCandidateMock};

        app = setupApp(db, legacyCandidatesGateway);
    });

    afterEach(async () => {
        await db.close();
    });

    it("should create a candidate and synchronize it with Legacy API", async () => {
        const payload: CreateCandidateDto = {
            firstName: "Jan",
            lastName: "Kowalski",
            email: "jan.kowalski@example.com",
            phone: "123-456-789",
            yearsOfExperience: 4,
            recruiterNotes: "Strong backend experience",
            status: "new",
            consentDate: "2026-06-14T10:00:00.000Z",
            jobOfferIds: [1, 5],
        };

        const response = await request(app)
            .post("/candidates")
            .send(payload)
            .expect("Content-Type", /json/)
            .expect(201);

        expect(response.body).toMatchObject({
            message: "Candidate created successfully",
            candidate: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
                yearsOfExperience:
                    payload.yearsOfExperience,
                recruiterNotes:
                    payload.recruiterNotes,
                status: payload.status,
                jobOfferIds: [1, 5],
            },
        });

        expect(createLegacyCandidateMock).toHaveBeenCalledTimes(1);

        expect(createLegacyCandidateMock).toHaveBeenCalledWith({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
        });

        const savedCandidate = await db.get<{
            id: number;
            email: string;
        }>(
            `
                SELECT id, email
                FROM Candidate
                WHERE email = ?
            `,
            payload.email,
        );

        expect(savedCandidate).toBeDefined();
        expect(savedCandidate?.email).toBe(payload.email);

        const assignedJobOffers = await db.all<
            Array<{ jobOfferId: number }>
        >(
            `
                SELECT
                    job_offer_id AS jobOfferId
                FROM CandidateJobOffer
                WHERE candidate_id = ?
                ORDER BY job_offer_id
            `,
            savedCandidate.id,
        );

        expect(
            assignedJobOffers.map((assignment) => assignment.jobOfferId),
        ).toEqual([1, 5]);
    });

    it("should reject creating a candidate without a job offer", async () => {
        const payload: CreateCandidateDto = {
            firstName: "Anna",
            lastName: "Nowak",
            email: "anna.nowak@example.com",
            phone: "555-123-456",
            yearsOfExperience: 2,
            recruiterNotes: "",
            status: "new",
            consentDate: "2026-06-14T10:00:00.000Z",
            jobOfferIds: [],
        };

        const response = await request(app)
            .post("/candidates")
            .send(payload)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body.message).toBe("Request body validation failed");

        expect(createLegacyCandidateMock).not.toHaveBeenCalled();

        const savedCandidate = await db.get<{ id: number }>(
            `
                SELECT id
                FROM Candidate
                WHERE email = ?
            `,
            payload.email,
        );

        expect(savedCandidate).toBeUndefined();
    });

    it("should rollback the candidate when Legacy API fails", async () => {
        createLegacyCandidateMock.mockRejectedValueOnce(
            createHttpError(
                502,
                "Legacy API request failed",
            ),
        );

        const payload: CreateCandidateDto = {
            firstName: "Piotr",
            lastName: "Nowak",
            email: "piotr.rollback@example.com",
            phone: "111-222-333",
            yearsOfExperience: 3,
            recruiterNotes:
                "This candidate should be rolled back",
            status: "new",
            consentDate: "2026-06-14T10:00:00.000Z",
            jobOfferIds: [1],
        };

        const response = await request(app)
            .post("/candidates")
            .send(payload)
            .expect("Content-Type", /json/)
            .expect(502);

        expect(response.body.message).toBe("Legacy API request failed");

        expect(createLegacyCandidateMock).toHaveBeenCalledTimes(1);

        const savedCandidate = await db.get<{ id: number }>(
            `
                SELECT id
                FROM Candidate
                WHERE email = ?
                `,
            payload.email,
        );

        expect(savedCandidate).toBeUndefined();
    });
});