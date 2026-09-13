-- Тоза кардани суроғаҳо.
--
-- Ду мушкил дар маълумоти мавҷуда:
--
--   1. 41 суроға бо коди Google Plus сар мешавад — «JQ6Q+C5P, улица
--      Карамова». Ин код ба хонанда ҳеҷ чиз намегӯяд ва ҷои дақиқро мо
--      аллакай дар latitude/longitude дорем, аз ин рӯ танҳо чашмро мебандад.
--
--   2. Пас аз тоза кардани код дар 22 сатр ғайр аз номи шаҳр чизе намемонад
--      — «Дангара», «Худжанд», «Гарм». Ин суроға нест: он чизе, ки дар
--      майдони city аллакай ҳаст, такрор мешавад ва вонамуд мекунад, ки мо
--      ҷои биноро медонем. Чунин сатрҳо NULL мешаванд ва дар харита ҳамон
--      нишони «ҷои тахминӣ»-ро мегиранд, ки ҳақиқат аст.

BEGIN;

-- ── 1. Коди Plus аз сар бурида мешавад ───────────────────────────────────
UPDATE universities
SET address = nullif(trim(regexp_replace(address, '^[A-Z0-9]{4}\+[A-Z0-9]{2,3},?\s*', '')), '')
WHERE address ~ '^[A-Z0-9]{4}\+[A-Z0-9]{2,3}';

UPDATE universities
SET translations = jsonb_set(
      translations, ARRAY[lang, 'address'],
      to_jsonb(trim(regexp_replace(translations->lang->>'address', '^[A-Z0-9]{4}\+[A-Z0-9]{2,3},?\s*', ''))),
      false)
FROM (SELECT unnest(ARRAY['ru', 'en']) AS lang) langs
WHERE translations->lang->>'address' ~ '^[A-Z0-9]{4}\+[A-Z0-9]{2,3}';

-- ── 2. Он чи танҳо номи маҳал монд, суроға нест ──────────────────────────
--
-- Аломати суроғаи ҳақиқӣ: рақами бино ё калимаи «кӯча / улица / хиёбон /
-- пер. / St». Бе ҳеҷ яки онҳо ин номи шаҳр аст, на ҷои бино.
UPDATE universities
SET address = NULL,
    translations = translations #- '{ru,address}' #- '{en,address}'
WHERE address IS NOT NULL
  AND address !~ '[0-9]'
  AND address !~* '(кӯча|куча|kуча|улица|хиёбон|проспект|пер\.|переулок|street|st\.|str\.| st$|ave)';

COMMIT;

SELECT count(*) AS hama,
       count(address) AS surogha_haqiqi,
       count(*) FILTER (WHERE "hasExactLocation") AS koordinatai_daqiq
FROM universities;
