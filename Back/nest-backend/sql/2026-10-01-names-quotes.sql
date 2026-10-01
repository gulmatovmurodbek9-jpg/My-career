-- 73, 129, 177: номҳои муассисаҳо — тартиби дурусти калимаҳо, бе қавс, нохунаки «…».
BEGIN;

-- 73
UPDATE universities
SET name = 'Филиали Донишгоҳи миллии тадқиқотии «Донишкадаи энергетикии Москва» дар шаҳри Душанбе'
WHERE name = 'Филиали "Донишгоҳи миллии тадқиқотӣ"-и Донишкадаи энергетикии Москва дар шаҳри Душанбе';

-- 129
UPDATE universities SET name = replace(name, 'Донишгоҳи (славянии) Россия ва Тоҷикистон', 'Донишгоҳи славянии Россия ва Тоҷикистон')
WHERE name LIKE '%Донишгоҳи (славянии) Россия ва Тоҷикистон%';

-- 177: "…" → «…» (тоҷикӣ ва русӣ)
UPDATE universities SET name = regexp_replace(name, '"([^"]*)"', '«\1»', 'g') WHERE name LIKE '%"%';
UPDATE universities
SET translations = jsonb_set(translations, '{ru,name}', to_jsonb(regexp_replace(translations->'ru'->>'name', '"([^"]*)"', '«\1»', 'g')))
WHERE translations->'ru'->>'name' LIKE '%"%';

COMMIT;
