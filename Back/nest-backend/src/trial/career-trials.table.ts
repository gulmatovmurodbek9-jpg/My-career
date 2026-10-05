// Ҷадвали сенарияҳои ихтисосҳо (бе migration; такрор зарар намерасонад).
export const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS career_trials (
        "careerId" uuid PRIMARY KEY,
        content jsonb NOT NULL,
        model varchar(60) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'ai',
        "createdAt" timestamptz NOT NULL DEFAULT now()
    )`;
