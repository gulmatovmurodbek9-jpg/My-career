-- Суроға ва координатаи дақиқи муассисаҳо.
--
-- Ҳар сатр аз OpenStreetMap гирифта шуда, номи бозгашта бо номи мо як ба як
-- санҷида шудааст. Мутобиқати тахминӣ дохил НАШУД: суроғаи хато довталабро
-- ба бинои бегона мебарад, ки аз набудани суроға бадтар аст.
--
-- Барои 55 муассисаи дигар OpenStreetMap ҳеҷ маълумот надорад ва дар база
-- ягон сомонаи расмӣ сабт нашудааст. Онҳо то ҳол дар маркази шаҳр бо нишони
-- «ҷои тахминӣ» меистанд — маҳз ҳамон чизе, ки ҳастанд.

BEGIN;

-- ── Суроғаи пурра + координатаи бино ─────────────────────────────────────

-- Донишгоҳи (славянии) Россия ва Тоҷикистон
UPDATE universities SET
  address = 'кӯчаи Мирзо Турсунзода 30, Душанбе',
  latitude = 38.5754399, longitude = 68.7929970, "hasExactLocation" = true,
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Мирзо Турсунзаде 30, Душанбе"', true),
    '{en,address}', '"30 Mirzo Tursunzoda Street, Dushanbe"', true)
WHERE id = 'bb43ae29-90e6-4736-a0f5-cb8bddabea52';

-- Коллеҷи муҳандисию омӯзгории шаҳри Душанбе
UPDATE universities SET
  address = 'кӯчаи Борбад, Душанбе',
  latitude = 38.5275461, longitude = 68.7499952, "hasExactLocation" = true,
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Борбад, Душанбе"', true),
    '{en,address}', '"Borbad Street, Dushanbe"', true)
WHERE id = '9ac52654-d43e-4d3a-9715-4b45495e29d8';

-- Донишкадаи омӯзгории Тоҷикистон дар шаҳри Панҷакент
UPDATE universities SET
  address = 'кӯчаи Ҳофизи Шерозӣ, Панҷакент',
  latitude = 39.4940605, longitude = 67.6019336, "hasExactLocation" = true,
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Хафиза Шерози, Пенджикент"', true),
    '{en,address}', '"Hofiz Sherozi Street, Panjakent"', true)
WHERE id = '2a46ae2e-120a-41ca-a879-e90a8be8de4a';

-- Донишгоҳи давлатии Хуҷанд ба номи академик Бобоҷон Ғафуров
UPDATE universities SET
  address = 'кӯчаи Мавлонбекова 1, Хуҷанд',
  latitude = 40.2842754, longitude = 69.6210832, "hasExactLocation" = true,
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Мавлонбекова 1, Худжанд"', true),
    '{en,address}', '"1 Mavlonbekova Street, Khujand"', true)
WHERE id = 'c7022608-6f01-415c-91a3-22936b3d25fe';

-- Донишкадаи политехникии ДТТ ба номи академик М. Осимӣ дар Хуҷанд
UPDATE universities SET
  address = 'кӯчаи Ленин 226, Хуҷанд',
  latitude = 40.2716784, longitude = 69.6407847, "hasExactLocation" = true,
  translations = jsonb_set(
    jsonb_set(translations, '{ru,address}', '"улица Ленина 226, Худжанд"', true),
    '{en,address}', '"226 Lenin Street, Khujand"', true)
WHERE id = 'ee9da66c-202a-474d-8010-0477eb7ba95a';

-- ── Танҳо координатаи бино (кӯча дар OSM нест) ───────────────────────────

-- Донишгоҳи давлатии Бохтар ба номи Носири Хусрав
UPDATE universities SET
  latitude = 37.8386814, longitude = 68.7860742, "hasExactLocation" = true
WHERE id = 'c51d2b95-96b9-4539-a8c6-ae3d6fd019a1';

-- Донишгоҳи байналмилалии забонҳои хориҷии Тоҷикистон ба номи Сотим Улуғзода
UPDATE universities SET
  latitude = 38.5767096, longitude = 68.7297206, "hasExactLocation" = true
WHERE id = '92735087-ecc2-4192-a32e-2d1040f15b21';

-- Донишкадаи исломии Тоҷикистон ба номи Имоми Аъзам
UPDATE universities SET
  latitude = 38.5874478, longitude = 68.7848843, "hasExactLocation" = true
WHERE id = 'b73fa9a3-c452-4f5d-8d4d-b2fcb982c333';

COMMIT;

-- Санҷиш
SELECT count(*) AS hama,
       count(address) AS surogha,
       count(*) FILTER (WHERE "hasExactLocation") AS koordinatai_daqiq
FROM universities;
