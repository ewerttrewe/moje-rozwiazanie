CREATE TABLE Candidate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT NOT NULL,
    years_of_experience INTEGER NOT NULL
       CHECK (years_of_experience >= 0),
    recruiter_notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL
       CHECK (
           status IN (
                  'new',
                  'in_progress',
                  'accepted',
                  'rejected'
               )
           ),
    consent_date TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CandidateJobOffer (
   candidate_id INTEGER NOT NULL,
   job_offer_id INTEGER NOT NULL,

   PRIMARY KEY (candidate_id, job_offer_id),

   FOREIGN KEY (candidate_id)
       REFERENCES Candidate(id)
       ON DELETE CASCADE,

   FOREIGN KEY (job_offer_id)
       REFERENCES JobOffer(id)
       ON DELETE CASCADE
);

CREATE INDEX idx_candidate_email
    ON Candidate(email);

CREATE INDEX idx_candidate_job_offer_job_id
    ON CandidateJobOffer(job_offer_id);