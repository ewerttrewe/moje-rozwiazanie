Nie wiem czy Państwo chcieli w zadaniu aby posługiwać się RAW SQLem.
Jest to z pewnością dobry sposób na sprawdzenie wiedzy kandydata ale jednak nowoczesne narzędzia ORM/ODM są znacznie wygodniejsze w pracy, poniżej przedstawiam strukturę tego jak wyobrażam sobie modele dla entitites w bazie:

```prisma
enum CandidateStatus {
    NEW         @map("new")
    IN_PROGRESS @map("in_progress")
    ACCEPTED    @map("accepted")
    REJECTED    @map("rejected")
}

model Recruiter {
id        Int      @id @default(autoincrement())
    name      String
    email     String   @unique
    phone     String?
    company   String
    createdAt DateTime @default(now()) @map("created_at")
    
    @@map("Recruiter")
}

model JobOffer {
    id          Int      @id @default(autoincrement())
    title       String
    description String
    salaryRange String?  @map("salary_range")
    location    String?
    createdAt   DateTime @default(now()) @map("created_at")
    
    candidates CandidateJobOffer[]
    
    @@map("JobOffer")
}

model Candidate {
    id                Int             @id @default(autoincrement())
    firstName         String          @map("first_name")
    lastName          String          @map("last_name")
    email             String          @unique
    phone             String
    yearsOfExperience Int             @map("years_of_experience")
    recruiterNotes    String          @default("") @map("recruiter_notes")
    status            CandidateStatus
    consentDate       DateTime        @map("consent_date")
    createdAt         DateTime        @default(now()) @map("created_at")
    
    jobOffers CandidateJobOffer[]
    
    @@map("Candidate")
}

model CandidateJobOffer {
    candidateId Int @map("candidate_id")
    jobOfferId  Int @map("job_offer_id")
    
    candidate Candidate @relation(
    fields: [candidateId],
    references: [id],
    onDelete: Cascade
)

    jobOffer JobOffer @relation(
    fields: [jobOfferId],
    references: [id],
    onDelete: Cascade
)

    @@id([candidateId, jobOfferId])
    @@index([jobOfferId])
    @@map("CandidateJobOffer")
}
```