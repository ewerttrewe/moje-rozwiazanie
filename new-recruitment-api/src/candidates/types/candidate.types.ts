import type { CreateCandidateDto } from "../dto/create-candidate.dto";

export type CandidateStatus = CreateCandidateDto["status"];

export interface Candidate {
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
    jobOfferIds: number[];
}

export interface PaginatedCandidates {
    items: Candidate[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}