-- Ҷустуҷӯи ихтисос бо хатои имлоӣ (resolveCareer → similarity). Як бор иҷро кунед:
--   psql -U postgres -d career_db -f sql/2026-09-26-career-trgm.sql
-- Ифода бояд бо TAJIK_FOLD дар career.service.ts айнан як бошад.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_career_name_trgm ON public.career
    USING gin (translate(lower((name)::text), 'ғӣқӯҳҷҒӢҚӮҲҶ'::text, 'гикухчгикухч'::text) gin_trgm_ops);
