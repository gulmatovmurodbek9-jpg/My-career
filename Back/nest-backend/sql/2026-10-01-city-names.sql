-- 105, 133–136: як шаҳр / вилоят — як ном дар ҳар забон.
BEGIN;

UPDATE universities SET region = 'Кӯҳистони Бадахшон' WHERE region = 'ВМКБ';
UPDATE universities SET translations = jsonb_set(translations, '{ru,region}', '"Горный Бадахшан"') WHERE region = 'Кӯҳистони Бадахшон' AND translations ? 'ru';
UPDATE universities SET translations = jsonb_set(translations, '{en,region}', '"Gorno-Badakhshan"') WHERE region = 'Кӯҳистони Бадахшон' AND translations ? 'en';

UPDATE universities SET translations = jsonb_set(translations, '{ru,region}', '"Согд"') WHERE translations->'ru'->>'region' = 'Согдийская область';
UPDATE universities SET translations = jsonb_set(translations, '{ru,region}', '"Хатлон"') WHERE translations->'ru'->>'region' = 'Хатлонская область';
UPDATE universities SET translations = jsonb_set(translations, '{en,region}', '"Sughd"') WHERE translations->'en'->>'region' = 'Sughd Region';
UPDATE universities SET translations = jsonb_set(translations, '{en,region}', '"Khatlon"') WHERE translations->'en'->>'region' = 'Khatlon Region';

UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Dangara"') WHERE translations->'en'->>'city' = 'Danghara';
UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Kulob"') WHERE translations->'en'->>'city' = 'Kulyab';
UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Tursunzoda"') WHERE translations->'en'->>'city' = 'Tursunzade';
UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Khorog"') WHERE translations->'en'->>'city' = 'Khorugh';
UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Zafarobod"') WHERE translations->'en'->>'city' = 'Zafarabad';
UPDATE universities SET translations = jsonb_set(translations, '{ru,city}', '"Зафарабад"') WHERE city = 'Зафаробод' AND translations ? 'ru';
UPDATE universities SET translations = jsonb_set(translations, '{ru,city}', '"Канибадам"') WHERE city = 'Конибодом' AND translations ? 'ru';
UPDATE universities SET translations = jsonb_set(translations, '{ru,city}', '"Мир Сайид Али Хамадони"') WHERE city = 'Мир Сайид Алии Ҳамадонӣ' AND translations ? 'ru';
UPDATE universities SET translations = jsonb_set(translations, '{en,city}', '"Mir Sayyid Ali Hamadoni"') WHERE city = 'Мир Сайид Алии Ҳамадонӣ' AND translations ? 'en';

-- 71: ҳарфҳои тоҷикӣ дар матни русӣ (суроға ва ном)
UPDATE universities
SET translations = jsonb_set(translations, '{ru,address}', to_jsonb(replace(translations->'ru'->>'address', 'Мир Сайид Алии Ҳамадонӣ', 'Мир Сайид Али Хамадони')))
WHERE translations->'ru'->>'address' LIKE '%Ҳамадонӣ%';

UPDATE universities
SET translations = jsonb_set(translations, '{ru,name}', to_jsonb(replace(translations->'ru'->>'name', 'Мир Сайид Алии Ҳамадонӣ', 'Мир Сайид Али Хамадони')))
WHERE translations->'ru'->>'name' LIKE '%Ҳамадонӣ%';

COMMIT;
