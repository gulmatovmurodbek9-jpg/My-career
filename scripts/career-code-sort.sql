-- Тартиби ихтисосҳо аз рӯи рақами расмии ММТ.
--
-- Кодҳо дарозии гуногун доранд (5–18 рақам), барои ҳамин муқоисаи оддии
-- матнӣ «10020503»-ро пеш аз «1010101» мегузошт. Ин сутун ҳамаи рақамҳоро
-- мегирад ва то 20 аломат бо сифр пур мекунад.
--
-- Сутуни оддӣ + триггер, на GENERATED: сутуни GENERATED TypeORM-ро маҷбур
-- мекунад ҷадвали `typeorm_metadata`-ро ҷӯяд ва дар реҷаи synchronize
-- пайвастшавӣ ба базаро тамоман вайрон мекунад.
ALTER TABLE career ADD COLUMN IF NOT EXISTS "codeSort" text;

CREATE OR REPLACE FUNCTION career_fill_code_sort() RETURNS trigger AS $$
BEGIN
    NEW."codeSort" := lpad(regexp_replace(coalesce(NEW.code, ''), '[^0-9]', '', 'g'), 20, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_fill_code_sort ON career;
CREATE TRIGGER trg_career_fill_code_sort
    BEFORE INSERT OR UPDATE OF code ON career
    FOR EACH ROW EXECUTE FUNCTION career_fill_code_sort();

-- Сатрҳои мавҷуда
UPDATE career
   SET "codeSort" = lpad(regexp_replace(coalesce(code, ''), '[^0-9]', '', 'g'), 20, '0')
 WHERE "codeSort" IS DISTINCT FROM lpad(regexp_replace(coalesce(code, ''), '[^0-9]', '', 'g'), 20, '0');

CREATE INDEX IF NOT EXISTS "idx_career_code_sort" ON career ("codeSort");
