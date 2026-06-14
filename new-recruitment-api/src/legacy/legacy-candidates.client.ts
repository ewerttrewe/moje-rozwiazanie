import axios from "axios";
import type { AxiosInstance } from "axios";
import createHttpError = require("http-errors");

export interface LegacyCandidatePayload {
    firstName: string;
    lastName: string;
    email: string;
}

export interface LegacyCandidatesGateway {
    createCandidate(candidate: LegacyCandidatePayload): Promise<void>;
}

export class LegacyCandidatesClient
    implements LegacyCandidatesGateway
{
    private readonly client: AxiosInstance;

    constructor(baseUrl: string, apiKey: string) {
        this.client = axios.create({
            baseURL: baseUrl.replace(/\/$/, ""),
            timeout: 5000,

            headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
            },
        });
    }

    async createCandidate(candidate: LegacyCandidatePayload): Promise<void> {
        try {
            await this.client.post(
                "/candidates",
                candidate,
            );
        } catch (error) {
            if (!axios.isAxiosError(error)) {
                throw error;
            }

            const legacyStatus = error.response?.status;
            if (legacyStatus === 409) {
                throw createHttpError(
                    409,
                    "Candidate already exists in Legacy API",
                );
            }

            if (legacyStatus === 400) {
                throw createHttpError(
                    502,
                    "Legacy API rejected candidate data",
                    {
                        details:
                        error.response?.data,
                    },
                );
            }

            if (legacyStatus === 403) {
                throw createHttpError(
                    502,
                    "Legacy API rejected the configured API key",
                );
            }

            if (legacyStatus === 504) {
                throw createHttpError(
                    502,
                    "Legacy API is temporarily unavailable",
                );
            }

            if (!error.response) {
                throw createHttpError(
                    502,
                    "Could not connect to Legacy API",
                );
            }

            throw createHttpError(
                502,
                "Legacy API request failed",
                {
                    details: {
                        legacyStatus,
                    },
                },
            );
        }
    }
}