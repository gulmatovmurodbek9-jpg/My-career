-- Тасдиқи почта бо коди 6-рақама. Дар production synchronize хомӯш аст,
-- пас пеш аз deploy як бор иҷро кунед:
--   psql -U postgres -d career_db -f sql/2026-09-28-email-verify.sql
-- DEFAULT true: ҳамаи корбарони ҳозира тасдиқшуда ҳисоб мешаванд.
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "verifyCodeHash" character varying,
    ADD COLUMN IF NOT EXISTS "verifyExpiresAt" timestamptz,
    ADD COLUMN IF NOT EXISTS "verifyAttempts" integer NOT NULL DEFAULT 0;
