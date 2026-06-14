import "dotenv/config";
import * as process from "node:process";
import { setupApp } from "./app";
import { setupDb } from "./db";
import { LegacyCandidatesClient } from "./legacy/legacy-candidates.client";

const PORT = Number(process.env.PORT ?? 3000);

main().catch((error) => {
    console.error("[server]: Application failed to start", error);
    process.exit(1);
});

async function main() {
    const legacyApiUrl = process.env.LEGACY_API_URL ?? "http://localhost:4040";
    const legacyApiKey = process.env.LEGACY_API_KEY ?? "";

    if (!legacyApiKey) {
        throw new Error("LEGACY_API_KEY is required");
    }

    const db = await setupDb();

    const legacyCandidatesClient = new LegacyCandidatesClient(legacyApiUrl, legacyApiKey);

    const app = setupApp(db, legacyCandidatesClient);

    app.listen(PORT, () => {
        console.log(`[server]: Server is running at http://localhost:${PORT}`);
    });
}