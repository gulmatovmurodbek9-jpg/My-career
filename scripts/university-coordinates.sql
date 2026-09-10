-- ═══════════════════════════════════════════════════════════════
--  Миграцияи дастӣ барои сервер
-- ═══════════════════════════════════════════════════════════════
--
--  Дар сервер NODE_ENV=production аст, яъне TypeORM synchronize-ро
--  ХОМӮШ мекунад ва сутунҳои навро худаш намесозад. Бе ин файл API
--  баъди деплой меафтад.
--
--  Иҷро:
--    psql -U postgres -d career_db -f scripts/university-coordinates.sql
--
-- ─── Сутунҳои нав ───

-- Барқарорсозии парол бо коди 6-рақама
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "resetTokenHash" varchar;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" timestamptz;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "resetAttempts" integer NOT NULL DEFAULT 0;

-- Рӯйхати ҳуҷҷатсупорӣ
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "applicationChoices" jsonb DEFAULT '[]'::jsonb;

-- ─── Координатаҳои воқеии донишгоҳҳо ───
--
--  Аз Google Places, OpenStreetMap ва Wikidata ҷамъ шудаанд. Барнома
--  онҳоро дар сервер аз нав ҷустуҷӯ намекунад — қиматҳо ин ҷоянд.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS "hasExactLocation" boolean NOT NULL DEFAULT false;

BEGIN;
UPDATE universities SET latitude=38.5957940, longitude=68.7850500, "hasExactLocation"=true WHERE name='Академияи идоракунии давлатии назди Президенти Ҷумҳурии Точикистон';
UPDATE universities SET latitude=38.6094000, longitude=68.7869000, "hasExactLocation"=true WHERE name='Донишгоҳи аграрии Тоҷикистон ба номи Шириншоҳ Шоҳтемур';
UPDATE universities SET latitude=38.5255970, longitude=68.7550040, "hasExactLocation"=true WHERE name='Донишгоҳи байналмилалии сайёҳӣ ва соҳибкории Тоҷикистон';
UPDATE universities SET latitude=37.8386810, longitude=68.7860740, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии Бохтар ба номи Носири Хусрав';
UPDATE universities SET latitude=38.0982370, longitude=69.3435850, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии Данғара';
UPDATE universities SET latitude=37.9153830, longitude=69.7866520, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ';
UPDATE universities SET latitude=38.5625500, longitude=68.8039500, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии молия ва иқтисоди Тоҷикистон';
UPDATE universities SET latitude=38.5938180, longitude=68.7864370, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии омӯзгории Тоҷикистон ба номи Садриддин Айнӣ';
UPDATE universities SET latitude=38.6017500, longitude=68.7855170, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии тиббии Тоҷикистон ба номи Абӯалӣ ибни Сино';
UPDATE universities SET latitude=38.1015880, longitude=69.3304380, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии тиббии Хатлон';
UPDATE universities SET latitude=38.5326000, longitude=68.7583000, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии тиҷорати Тоҷикистон';
UPDATE universities SET latitude=37.4919210, longitude=71.5529220, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии Хоруғ ба номи Моёншо Назаршоев';
UPDATE universities SET latitude=40.2842750, longitude=69.6210830, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии Хуҷанд ба номи академик Бобоҷон Ғафуров';
UPDATE universities SET latitude=40.3036070, longitude=69.6117640, "hasExactLocation"=true WHERE name='Донишгоҳи давлатии ҳуқуқ, бизнес ва сиёсати Тоҷикистон';
UPDATE universities SET latitude=38.5653850, longitude=68.7947880, "hasExactLocation"=true WHERE name='Донишгоҳи миллии Тоҷикистон';
UPDATE universities SET latitude=37.4917940, longitude=71.5441260, "hasExactLocation"=true WHERE name='Донишгоҳи Осиёи Марказӣ';
UPDATE universities SET latitude=38.5645650, longitude=68.7891690, "hasExactLocation"=true WHERE name='Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ';
UPDATE universities SET latitude=38.5295540, longitude=68.7589990, "hasExactLocation"=true WHERE name='Донишгоҳи технологии Тоҷикистон';
UPDATE universities SET latitude=40.3085580, longitude=69.6293650, "hasExactLocation"=true WHERE name='Донишкадаи байналмилалии Хуҷанди Донишгоҳи байналмилалии сайёҳӣ ва соҳибкории Тоҷикистон';
UPDATE universities SET latitude=38.5266040, longitude=68.7477050, "hasExactLocation"=true WHERE name='Донишкадаи давлатии фарҳанг ва санъати Тоҷикистон ба номи Мирзо Турсунзода';
UPDATE universities SET latitude=40.2750070, longitude=69.6048710, "hasExactLocation"=true WHERE name='Донишкадаи иқтисод ва савдои Донишгоҳи давлатии тиҷорати Тоҷикистон дар шаҳри Хуҷанд';
UPDATE universities SET latitude=39.0036320, longitude=70.3261620, "hasExactLocation"=true WHERE name='Донишкадаи омӯзгории Тоҷикистон дар ноҳияи Рашт';
UPDATE universities SET latitude=40.2722000, longitude=69.6412000, "hasExactLocation"=true WHERE name='Донишкадаи политехникии Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ дар шаҳри Хуҷанд';
UPDATE universities SET latitude=38.6053190, longitude=68.7655260, "hasExactLocation"=true WHERE name='Донишкадаи тарбияи ҷисмонии Тоҷикистон ба номи С. Раҳимов';
UPDATE universities SET latitude=38.5637730, longitude=68.7667210, "hasExactLocation"=true WHERE name='Донишкадаи тиббӣ-иҷтимоии Тоҷикистон (ғайридавлатӣ)';
UPDATE universities SET latitude=37.8758440, longitude=68.7267500, "hasExactLocation"=true WHERE name='Донишкадаи энергетикии Тоҷикистон';
UPDATE universities SET latitude=40.3148210, longitude=69.6563480, "hasExactLocation"=true WHERE name='Коллеҷи инноватсионии Хуҷанд (ғайридавлатӣ)';
UPDATE universities SET latitude=38.5260450, longitude=68.7588300, "hasExactLocation"=true WHERE name='Коллеҷи информатика ва техникаи компютерии шаҳри Душанбе';
UPDATE universities SET latitude=38.5204060, longitude=68.2376150, "hasExactLocation"=true WHERE name='Коллеҷи металлургии шаҳри Турсунзода';
UPDATE universities SET latitude=38.8985700, longitude=70.1211810, "hasExactLocation"=true WHERE name='Коллеҷи муҳандисӣ-техникии ноҳияи Нуробод';
UPDATE universities SET latitude=38.5594650, longitude=69.0170160, "hasExactLocation"=true WHERE name='Коллеҷи омори шаҳри Ваҳдат';
UPDATE universities SET latitude=37.8458440, longitude=68.7990750, "hasExactLocation"=true WHERE name='Коллеҷи омӯзгории Донишгоҳи давлатии Бохтар ба номи Носири Хусрав';
UPDATE universities SET latitude=37.9152220, longitude=69.7867080, "hasExactLocation"=true WHERE name='Коллеҷи омӯзгории Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ';
UPDATE universities SET latitude=40.1994890, longitude=68.9485050, "hasExactLocation"=true WHERE name='Коллеҷи омӯзгории ноҳияи Зафаробод';
UPDATE universities SET latitude=39.2212940, longitude=71.2007910, "hasExactLocation"=true WHERE name='Коллеҷи омӯзгории ноҳияи Лахш';
UPDATE universities SET latitude=38.5130440, longitude=68.2086740, "hasExactLocation"=true WHERE name='Коллеҷи омӯзгории шаҳри Турсунзода';
UPDATE universities SET latitude=38.0982370, longitude=69.3435850, "hasExactLocation"=true WHERE name='Коллеҷи политехникии Донишгоҳи давлатии Данғара';
UPDATE universities SET latitude=40.1791040, longitude=68.8582860, "hasExactLocation"=true WHERE name='Коллеҷи политехникии ноҳияи Зафаробод';
UPDATE universities SET latitude=38.5921560, longitude=68.7528960, "hasExactLocation"=true WHERE name='Коллеҷи тарбияи ҷисмонии Тоҷикистон';
UPDATE universities SET latitude=38.5644670, longitude=68.7899320, "hasExactLocation"=true WHERE name='Коллеҷи техникии Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ';
UPDATE universities SET latitude=39.4943230, longitude=67.5936220, "hasExactLocation"=true WHERE name='Коллеҷи технологӣ ва инноватсионӣ дар шаҳри Панҷакент (ғайридавлатӣ)';
UPDATE universities SET latitude=40.2959630, longitude=70.4207930, "hasExactLocation"=true WHERE name='Коллеҷи технологии ба номи А. Қаҳҳорови шаҳри Конибодом';
UPDATE universities SET latitude=38.5360540, longitude=68.7533160, "hasExactLocation"=true WHERE name='Коллеҷи технологии шаҳри Душанбе';
UPDATE universities SET latitude=37.2405500, longitude=69.1081490, "hasExactLocation"=true WHERE name='Коллеҷи тиббӣ-инноватсионии ноҳияи Панҷ (ғайридавлатӣ)';
UPDATE universities SET latitude=38.0982370, longitude=69.3435850, "hasExactLocation"=true WHERE name='Коллеҷи тиббӣ-иҷтимоии ноҳияи Данғара (ғайридавлатӣ)';
UPDATE universities SET latitude=37.2704110, longitude=68.1325390, "hasExactLocation"=true WHERE name='Коллеҷи тиббӣ-иҷтимоии ноҳияи Шаҳритус (ғайридавлатӣ)';
UPDATE universities SET latitude=38.1016360, longitude=69.3316370, "hasExactLocation"=true WHERE name='Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар деҳаи Кангурти ноҳияи Темурмалик';
UPDATE universities SET latitude=38.0951800, longitude=69.3493240, "hasExactLocation"=true WHERE name='Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар ноҳияи Данғара';
UPDATE universities SET latitude=40.2294960, longitude=69.7270210, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ноҳияи Бобоҷон Ғафуров (ғайридавлатӣ)';
UPDATE universities SET latitude=37.7137640, longitude=68.8315260, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ноҳияи Вахш (ғайридавлатӣ)';
UPDATE universities SET latitude=38.3084250, longitude=69.0369110, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ноҳияи Ёвон';
UPDATE universities SET latitude=37.6594320, longitude=69.6264410, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ноҳияи Мир Сайид Алии Ҳамадонӣ (ғайридавлатӣ)';
UPDATE universities SET latitude=39.0045100, longitude=70.3278000, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ноҳияи Рашт';
UPDATE universities SET latitude=37.8321720, longitude=68.7654660, "hasExactLocation"=true WHERE name='Коллеҷи тиббии хусусии "Даво"-и шаҳри Бохтар';
UPDATE universities SET latitude=38.5348300, longitude=68.7404380, "hasExactLocation"=true WHERE name='Коллеҷи тиббии ҷумҳуриявӣ';
UPDATE universities SET latitude=37.8412410, longitude=68.7781470, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Бохтар';
UPDATE universities SET latitude=40.2613690, longitude=69.7934190, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Гулистон (ғайридавлатӣ)';
UPDATE universities SET latitude=39.9053750, longitude=68.9953460, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Истаравшан';
UPDATE universities SET latitude=40.3069440, longitude=70.4261660, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Конибодом';
UPDATE universities SET latitude=37.9138370, longitude=69.8102360, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Кӯлоб';
UPDATE universities SET latitude=37.9138370, longitude=69.8102360, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Кӯлоб (ғайридавлатӣ)';
UPDATE universities SET latitude=39.4953260, longitude=67.5988530, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Панҷакент';
UPDATE universities SET latitude=38.5181930, longitude=68.2215990, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Турсунзода';
UPDATE universities SET latitude=38.5181930, longitude=68.2215990, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Турсунзода (ғайридавлатӣ)';
UPDATE universities SET latitude=37.4906450, longitude=71.5443850, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Хоруғ';
UPDATE universities SET latitude=38.5102940, longitude=68.6024510, "hasExactLocation"=true WHERE name='Коллеҷи тиббии шаҳри Ҳисор';
UPDATE universities SET latitude=38.5794370, longitude=68.7899780, "hasExactLocation"=true WHERE name='Филиали Донишгоҳи давлатии Москва ба номи М. В. Ломоносов дар шаҳри Душанбе';
UPDATE universities SET latitude=40.1312740, longitude=70.6183520, "hasExactLocation"=true WHERE name='Филиали Донишгоҳи технологии Тоҷикистон дар шаҳри Исфара';
COMMIT;

-- Ҳамагӣ: 68 донишгоҳ