-- Суроғаи пурраи донишгоҳҳо аз Google Places.
-- Танҳо барои онҳое, ки координатаи воқеӣ доранд — барои боқимонда
-- суроға маънои маркази шаҳрро мебуд ва довталабро гумроҳ мекард.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS address varchar;

BEGIN;
UPDATE universities SET address='кӯчаи Саид Носиров 33, Душанбе' WHERE name='Академияи идоракунии давлатии назди Президенти Ҷумҳурии Точикистон';
UPDATE universities SET address='JQ6Q+C5P, улица Карамова, Душанбе' WHERE name='Донишгоҳи аграрии Тоҷикистон ба номи Шириншоҳ Шоҳтемур';
UPDATE universities SET address='Душанбе' WHERE name='Донишгоҳи байналмилалии сайёҳӣ ва соҳибкории Тоҷикистон';
UPDATE universities SET address='38XV+7CW, Дангара' WHERE name='Донишгоҳи давлатии Данғара';
UPDATE universities SET address='ул. Сафарова 16, Куляб' WHERE name='Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ';
UPDATE universities SET address='734067, г. Душанбе, улица Нахимова 64/1, Душанбе' WHERE name='Донишгоҳи давлатии молия ва иқтисоди Тоҷикистон';
UPDATE universities SET address='HQVP+GCW, хиёбони Рӯдакӣ, Душанбе' WHERE name='Донишгоҳи давлатии омӯзгории Тоҷикистон ба номи Садриддин Айнӣ';
UPDATE universities SET address='ТГМУ им. Абуали Сино (главный корпус), проспект Рудаки 139, Душанбе' WHERE name='Донишгоҳи давлатии тиббии Тоҷикистон ба номи Абӯалӣ ибни Сино';
UPDATE universities SET address='482J+MM2, Дангара' WHERE name='Донишгоҳи давлатии тиббии Хатлон';
UPDATE universities SET address='кӯч. Деҳоти 1/2, Донишгоҳи давлатии, GQM4+2V7 Ҷумҳурии Тоҷикистон, ш, Душанбе 734061' WHERE name='Донишгоҳи давлатии тиҷорати Тоҷикистон';
UPDATE universities SET address='FHR3+M2W, Lenin St, Хоруғ' WHERE name='Донишгоҳи давлатии Хоруғ ба номи Моёншо Назаршоев';
UPDATE universities SET address='17 микрорайон, Худжанд' WHERE name='Донишгоҳи давлатии ҳуқуқ, бизнес ва сиёсати Тоҷикистон';
UPDATE universities SET address='HQ8W+52M, Душанбе' WHERE name='Донишгоҳи миллии Тоҷикистон';
UPDATE universities SET address='FHR3+M2W, Lenin St, Хоруғ' WHERE name='Донишгоҳи Осиёи Марказӣ';
UPDATE universities SET address='HQ7Q+GMV, кӯчаи Академикҳо Раҷабов 10, Душанбе 734042' WHERE name='Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ';
UPDATE universities SET address='Н. Каробоев 63/3, Душанбе' WHERE name='Донишгоҳи технологии Тоҷикистон';
UPDATE universities SET address='8J5H+CPH, Худжанд' WHERE name='Донишкадаи байналмилалии Хуҷанди Донишгоҳи байналмилалии сайёҳӣ ва соҳибкории Тоҷикистон';
UPDATE universities SET address='GPHX+CPX, кӯчаи Борбад 73, Душанбе' WHERE name='Донишкадаи давлатии фарҳанг ва санъати Тоҷикистон ба номи Мирзо Турсунзода';
UPDATE universities SET address='7JG3+2W, пер. Сулейманова, Худжанд' WHERE name='Донишкадаи иқтисод ва савдои Донишгоҳи давлатии тиҷорати Тоҷикистон дар шаҳри Хуҷанд';
UPDATE universities SET address='283G+7GJ, Гарм' WHERE name='Донишкадаи омӯзгории Тоҷикистон дар ноҳияи Рашт';
UPDATE universities SET address='Unnamed Road, JQ48+46C, Душанбе' WHERE name='Донишкадаи тарбияи ҷисмонии Тоҷикистон ба номи С. Раҳимов';
UPDATE universities SET address='Ғаффор Мирзо 2, Душанбе' WHERE name='Донишкадаи тиббӣ-иҷтимоии Тоҷикистон (ғайридавлатӣ)';
UPDATE universities SET address='VPGH+W84, Курган-Тюбе' WHERE name='Донишкадаи энергетикии Тоҷикистон';
UPDATE universities SET address='8M74+WGH, Худжанд' WHERE name='Коллеҷи инноватсионии Хуҷанд (ғайридавлатӣ)';
UPDATE universities SET address='GQG5+CG8, Душанбе' WHERE name='Коллеҷи информатика ва техникаи компютерии шаҳри Душанбе';
UPDATE universities SET address='G6CQ+529, Турсунзаде' WHERE name='Коллеҷи металлургии шаҳри Турсунзода';
UPDATE universities SET address='V4XC+CF, Chumdon' WHERE name='Коллеҷи муҳандисӣ-техникии ноҳияи Нуробод';
UPDATE universities SET address='хиёбони Сомониён 22, Ваҳдат 735400' WHERE name='Коллеҷи омори шаҳри Ваҳдат';
UPDATE universities SET address='RQWX+8JP, Курган-Тюбе' WHERE name='Коллеҷи омӯзгории Донишгоҳи давлатии Бохтар ба номи Носири Хусрав';
UPDATE universities SET address='ул. Сафарова 16, Куляб' WHERE name='Коллеҷи омӯзгории Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ';
UPDATE universities SET address='5WXX+QCR, Мехнатобад' WHERE name='Коллеҷи омӯзгории ноҳияи Зафаробод';
UPDATE universities SET address='66C2+G87, Ноҳия, Ваҳдат' WHERE name='Коллеҷи омӯзгории ноҳияи Лахш';
UPDATE universities SET address='3мкр, Турсунзаде' WHERE name='Коллеҷи омӯзгории шаҳри Турсунзода';
UPDATE universities SET address='38XV+7CW, Дангара' WHERE name='Коллеҷи политехникии Донишгоҳи давлатии Данғара';
UPDATE universities SET address='5VH5+J8V, Зафарабад' WHERE name='Коллеҷи политехникии ноҳияи Зафаробод';
UPDATE universities SET address='Райен Сино улица, Авесто 27, Душанбе' WHERE name='Коллеҷи тарбияи ҷисмонии Тоҷикистон';
UPDATE universities SET address='HQ7Q+GMV, кӯчаи Академикҳо Раҷабов 10, Душанбе 734042' WHERE name='Коллеҷи техникии Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ';
UPDATE universities SET address='FHVV+PCH, A377, Панҷакент' WHERE name='Коллеҷи технологӣ ва инноватсионӣ дар шаҳри Панҷакент (ғайридавлатӣ)';
UPDATE universities SET address='7CWC+98M, kучаи ленин, Конибодом' WHERE name='Коллеҷи технологии ба номи А. Қаҳҳорови шаҳри Конибодом';
UPDATE universities SET address='GQP3+C8G, кӯчаи Борбад, Душанбе' WHERE name='Коллеҷи технологии шаҳри Душанбе';
UPDATE universities SET address='64R5+67C, Пяндж' WHERE name='Коллеҷи тиббӣ-инноватсионии ноҳияи Панҷ (ғайридавлатӣ)';
UPDATE universities SET address='38XV+7CW, Дангара' WHERE name='Коллеҷи тиббӣ-иҷтимоии ноҳияи Данғара (ғайридавлатӣ)';
UPDATE universities SET address='74CM+52, Шаартуз' WHERE name='Коллеҷи тиббӣ-иҷтимоии ноҳияи Шаҳритус (ғайридавлатӣ)';
UPDATE universities SET address='482J+MM2, Дангара' WHERE name='Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар деҳаи Кангурти ноҳияи Темурмалик';
UPDATE universities SET address='38WX+3PG, ул. Н Мирали, Данғара' WHERE name='Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар ноҳияи Данғара';
UPDATE universities SET address='Гафуров' WHERE name='Коллеҷи тиббии ноҳияи Бобоҷон Ғафуров (ғайридавлатӣ)';
UPDATE universities SET address='PR7J+CMH, Вахш' WHERE name='Коллеҷи тиббии ноҳияи Вахш (ғайридавлатӣ)';
UPDATE universities SET address='825P+9Q7, Яван' WHERE name='Коллеҷи тиббии ноҳияи Ёвон';
UPDATE universities SET address='ноҳияи Мир Сайид Алии Ҳамадонӣ ш. Москва, кӯч. И. Сомонӣ 27, Московский 735140' WHERE name='Коллеҷи тиббии ноҳияи Мир Сайид Алии Ҳамадонӣ (ғайридавлатӣ)';
UPDATE universities SET address='283H+R43, Гарм' WHERE name='Коллеҷи тиббии ноҳияи Рашт';
UPDATE universities SET address='RQJ8+V58, Курган-Тюбе' WHERE name='Коллеҷи тиббии хусусии "Даво"-и шаҳри Бохтар';
UPDATE universities SET address='кӯчаи Раҳмон Набиев 248, Душанбе' WHERE name='Коллеҷи тиббии ҷумҳуриявӣ';
UPDATE universities SET address='RQRH+F7R, Курган-Тюбе' WHERE name='Коллеҷи тиббии шаҳри Бохтар';
UPDATE universities SET address='Кайраккум, к. Ҷавони 2А Гулистон, Кайраккум' WHERE name='Коллеҷи тиббии шаҳри Гулистон (ғайридавлатӣ)';
UPDATE universities SET address='WX4W+44X, Ура-Тюбе' WHERE name='Коллеҷи тиббии шаҳри Истаравшан';
UPDATE universities SET address='8C4G+QFF, Канибадам' WHERE name='Коллеҷи тиббии шаҳри Конибодом';
UPDATE universities SET address='махаллаи Борбад, Кӯлоб' WHERE name='Коллеҷи тиббии шаҳри Кӯлоб';
UPDATE universities SET address='махаллаи Борбад, Кӯлоб' WHERE name='Коллеҷи тиббии шаҳри Кӯлоб (ғайридавлатӣ)';
UPDATE universities SET address='FHWX+4GQ, ул. Терешковой, Пенджикент' WHERE name='Коллеҷи тиббии шаҳри Панҷакент';
UPDATE universities SET address='Маҳаллаи 2, Турсунзода' WHERE name='Коллеҷи тиббии шаҳри Турсунзода';
UPDATE universities SET address='Маҳаллаи 2, Турсунзода' WHERE name='Коллеҷи тиббии шаҳри Турсунзода (ғайридавлатӣ)';
UPDATE universities SET address='улица Рахматова 52, Хоруғ' WHERE name='Коллеҷи тиббии шаҳри Хоруғ';
UPDATE universities SET address='GJ62+4X8, Гиссар' WHERE name='Коллеҷи тиббии шаҳри Ҳисор';
UPDATE universities SET address='улица Бохтар, 35/1, кӯчаи Шоҳтемур 42, Душанбе 734003' WHERE name='Филиали Донишгоҳи давлатии Москва ба номи М. В. Ломоносов дар шаҳри Душанбе';
UPDATE universities SET address='4JJ8+VW7 Коллеҷи Технологии Исфара, улица Советская 55, Исфара 735920' WHERE name='Филиали Донишгоҳи технологии Тоҷикистон дар шаҳри Исфара';
COMMIT;

-- Ҳамагӣ: 65