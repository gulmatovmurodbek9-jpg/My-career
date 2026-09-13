-- Тартиби ниҳоии суроғаҳо.
--
--   1. Коди Google Plus метавонад дар мобайни сатр бошад, на танҳо дар сар
--      — «Unnamed Road, JQ48+46C, Душанбе». Филтри қаблӣ танҳо саршавиро
--      медид.
--   2. «Unnamed Road» ва думи такрории «Ҷумҳурии Тоҷикистон» маълумот
--      намедиҳанд.
--   3. Ду сатри Хоруғ, ки суроғаашон баргашт, тарҷумаи ru/en надоранд.

BEGIN;

-- Коди Plus дар ҳар ҷои сатр
UPDATE universities
SET address = trim(both ' ,' from regexp_replace(address, '\m[A-Z0-9]{4}\+[A-Z0-9]{2,3}\M,?\s*', '', 'g'))
WHERE address ~ '\m[A-Z0-9]{4}\+[A-Z0-9]{2,3}\M';

UPDATE universities
SET address = trim(both ' ,' from regexp_replace(address, 'Unnamed Road,?\s*', '', 'g'))
WHERE address LIKE '%Unnamed Road%';

-- Суроғаҳои Хоруғ бо се забон
UPDATE universities SET
  address = 'кӯчаи Ленин, Хоруғ',
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Ленина, Хорог"', true),
    '{en,address}', '"Lenin Street, Khorugh"', true)
WHERE address = 'Lenin St, Хоруғ';

COMMIT;

SELECT count(*) AS hama,
       count(address) AS surogha_haqiqi,
       count(*) FILTER (WHERE "hasExactLocation") AS koordinatai_daqiq
FROM universities;
