-- Барқарорсозии суроғаҳои воқеӣ аз дампи 12.09.2026.
--
-- Тозакунии қаблӣ аз ҳад зиёд бурид: филтр калимаи «St»-ро танҳо дар
-- охири сатр меҷуст, бинобар ин «Lenin St, Хоруғ» ҳамчун номи шаҳр
-- ҳисоб шуда NULL гашт. Ин ҷо ҳар суроға аз дамп дубора хонда мешавад:
-- коди Plus бурида мешавад ва танҳо сатрҳое мемонанд, ки нишони кӯча
-- доранд — рақами бино ё калимаи кӯча/улица/хиёбон/St.

BEGIN;

-- Коллеҷи тиббии шаҳри Гулистон (ғайридавлатӣ)
UPDATE universities SET address = 'Кайраккум, к. Ҷавони 2А Гулистон, Кайраккум' WHERE id = '9607cc28-d558-445c-b8dd-67b40ae1e7a6' AND address IS NULL;

-- Коллеҷи тиббии ноҳияи Мир Сайид Алии Ҳамадонӣ (ғайридавлатӣ)
UPDATE universities SET address = 'ноҳияи Мир Сайид Алии Ҳамадонӣ ш. Москва, кӯч. И. Сомонӣ 27, Московский 735140' WHERE id = '4a63dadd-a57b-4922-8120-d707184589f1' AND address IS NULL;

-- Коллеҷи тиббии шаҳри Турсунзода
UPDATE universities SET address = 'Маҳаллаи 2, Турсунзода' WHERE id = '29234901-1e42-40ad-afad-8210b0646a76' AND address IS NULL;

-- Коллеҷи тиббии шаҳри Турсунзода (ғайридавлатӣ)
UPDATE universities SET address = 'Маҳаллаи 2, Турсунзода' WHERE id = '27bf2c76-d9e1-45b7-819d-88750a8111a2' AND address IS NULL;

-- Коллеҷи тиббии шаҳри Хоруғ
UPDATE universities SET address = 'улица Рахматова 52, Хоруғ' WHERE id = 'd79e9179-331a-4290-867c-7c9911caf3fa' AND address IS NULL;

-- Донишкадаи тиббӣ-иҷтимоии Тоҷикистон (ғайридавлатӣ)
UPDATE universities SET address = 'Ғаффор Мирзо 2, Душанбе' WHERE id = '86b53303-d477-44bc-bb83-66d4702885c6' AND address IS NULL;

-- Коллеҷи омӯзгории Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ
UPDATE universities SET address = 'ул. Сафарова 16, Куляб' WHERE id = 'e750e00d-d7ac-4ea9-a3b5-86889e36ff0b' AND address IS NULL;

-- Коллеҷи омӯзгории шаҳри Турсунзода
UPDATE universities SET address = '3мкр, Турсунзаде' WHERE id = 'cbe3e5c6-7042-48c4-b18c-be8a10bab8fe' AND address IS NULL;

-- Коллеҷи тиббии ҷумҳуриявӣ
UPDATE universities SET address = 'кӯчаи Раҳмон Набиев 248, Душанбе' WHERE id = '993d844e-a0fb-4986-8170-a809ae3da527' AND address IS NULL;

-- Донишгоҳи давлатии тиббии Тоҷикистон ба номи Абӯалӣ ибни Сино
UPDATE universities SET address = 'ТГМУ им. Абуали Сино (главный корпус), проспект Рудаки 139, Душанбе' WHERE id = '4884c927-1575-486d-972c-b6567397bfa4' AND address IS NULL;

-- Донишкадаи тарбияи ҷисмонии Тоҷикистон ба номи С. Раҳимов
UPDATE universities SET address = 'Unnamed Road, JQ48+46C, Душанбе' WHERE id = '7a3fc8bc-a0c8-4078-ba9e-8cdfd35c152e' AND address IS NULL;

-- Коллеҷи тарбияи ҷисмонии Тоҷикистон
UPDATE universities SET address = 'Райен Сино улица, Авесто 27, Душанбе' WHERE id = '5cbc804e-4bae-4470-af61-2fb88ea322de' AND address IS NULL;

-- Коллеҷи омори шаҳри Ваҳдат
UPDATE universities SET address = 'хиёбони Сомониён 22, Ваҳдат 735400' WHERE id = '5593dcfb-0ded-4fb5-89e5-44cb17af8ab9' AND address IS NULL;

-- Коллеҷи техникии Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ
UPDATE universities SET address = 'кӯчаи Академикҳо Раҷабов 10, Душанбе 734042' WHERE id = '7a03f164-2d4c-42ae-88cb-0ad20efd1a4c' AND address IS NULL;

-- Коллеҷи технологӣ ва инноватсионӣ дар шаҳри Панҷакент (ғайридавлатӣ)
UPDATE universities SET address = 'A377, Панҷакент' WHERE id = '7a3a3cc5-6b44-49d8-9898-512a8fb1e3a5' AND address IS NULL;

-- Коллеҷи технологии ба номи А. Қаҳҳорови шаҳри Конибодом
UPDATE universities SET address = 'kучаи ленин, Конибодом' WHERE id = 'f45dc6b4-4f86-4a16-9756-337d45005435' AND address IS NULL;

-- Коллеҷи технологии шаҳри Душанбе
UPDATE universities SET address = 'кӯчаи Борбад, Душанбе' WHERE id = 'f9b8a0b4-e6ca-43f3-ad55-7df984600e49' AND address IS NULL;

-- Филиали Донишгоҳи давлатии Москва ба номи М. В. Ломоносов дар шаҳри Душанбе
UPDATE universities SET address = 'улица Бохтар, 35/1, кӯчаи Шоҳтемур 42, Душанбе 734003' WHERE id = 'f2123652-2ec8-489c-b3b7-c2a3eccaf6fd' AND address IS NULL;

-- Филиали Донишгоҳи технологии Тоҷикистон дар шаҳри Исфара
UPDATE universities SET address = 'Коллеҷи Технологии Исфара, улица Советская 55, Исфара 735920' WHERE id = 'c925bce7-ff63-492a-abc7-4ce8438f340f' AND address IS NULL;

-- Донишкадаи давлатии фарҳанг ва санъати Тоҷикистон ба номи Мирзо Турсунзода
UPDATE universities SET address = 'кӯчаи Борбад 73, Душанбе' WHERE id = '40058104-3319-452c-a1c6-e704ed83ecd2' AND address IS NULL;

-- Донишгоҳи давлатии Хоруғ ба номи Моёншо Назаршоев
UPDATE universities SET address = 'Lenin St, Хоруғ' WHERE id = 'ef8c38ad-98e4-4917-91f1-aa0772bf68e7' AND address IS NULL;

-- Донишгоҳи Осиёи Марказӣ
UPDATE universities SET address = 'Lenin St, Хоруғ' WHERE id = '62ec258d-2e17-41ff-98ad-a38e32a0c542' AND address IS NULL;

-- Академияи идоракунии давлатии назди Президенти Ҷумҳурии Точикистон
UPDATE universities SET address = 'кӯчаи Саид Носиров 33, Душанбе' WHERE id = '98b25714-84d5-4000-97cd-f9af245f31e7' AND address IS NULL;

-- Донишгоҳи аграрии Тоҷикистон ба номи Шириншоҳ Шоҳтемур
UPDATE universities SET address = 'улица Карамова, Душанбе' WHERE id = 'a7f2aceb-0fa7-45b4-bfef-c50aa1404218' AND address IS NULL;

-- Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ
UPDATE universities SET address = 'кӯчаи Академикҳо Раҷабов 10, Душанбе 734042' WHERE id = '8676154e-f7bd-44aa-b698-ea7489c38ded' AND address IS NULL;

-- Донишгоҳи технологии Тоҷикистон
UPDATE universities SET address = 'Н. Каробоев 63/3, Душанбе' WHERE id = '318a3572-510a-4f80-a844-15fd0070a7d3' AND address IS NULL;

-- Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ
UPDATE universities SET address = 'ул. Сафарова 16, Куляб' WHERE id = '3c207b03-a6d8-4148-a9f5-872ee2baad9b' AND address IS NULL;

-- Донишгоҳи давлатии молия ва иқтисоди Тоҷикистон
UPDATE universities SET address = '734067, г. Душанбе, улица Нахимова 64/1, Душанбе' WHERE id = 'b28b62a5-0bee-485a-9804-48f947c93d15' AND address IS NULL;

-- Донишгоҳи давлатии омӯзгории Тоҷикистон ба номи Садриддин Айнӣ
UPDATE universities SET address = 'хиёбони Рӯдакӣ, Душанбе' WHERE id = '06959bdc-3378-44db-9d20-628908758e56' AND address IS NULL;

-- Донишгоҳи давлатии тиҷорати Тоҷикистон
UPDATE universities SET address = 'кӯч. Деҳоти 1/2, Донишгоҳи давлатии, GQM4+2V7 Ҷумҳурии Тоҷикистон, ш, Душанбе 734061' WHERE id = 'f3d54f82-28a4-4c26-ac9a-6ab4841baf8b' AND address IS NULL;

-- Донишгоҳи давлатии ҳуқуқ, бизнес ва сиёсати Тоҷикистон
UPDATE universities SET address = '17 микрорайон, Худжанд' WHERE id = 'e308fa43-068a-41e9-b796-a97a02d29ff3' AND address IS NULL;

-- Донишкадаи иқтисод ва савдои Донишгоҳи давлатии тиҷорати Тоҷикистон дар шаҳри Хуҷанд
UPDATE universities SET address = 'пер. Сулейманова, Худжанд' WHERE id = '9d771f1d-e436-4a38-bfa6-d8fb608d8ce6' AND address IS NULL;

COMMIT;

SELECT count(*) AS hama, count(address) AS surogha FROM universities;
