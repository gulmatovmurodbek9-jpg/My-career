# 120 саволи SQL барои ҳимоя

**Барои кӣ:** ҳакамони техникӣ, махсусан C#-барномасоз (SQL Server ва Entity Framework). **База дар лоиҳа:** PostgreSQL + TypeORM.

- Истилоҳҳо бо **англисӣ** ва шарҳ бо тоҷикӣ.
- Ҷавобҳо кӯтоҳанд. Аввал ҷумлаи асосиро гӯед, мисолро танҳо агар пурсанд.
- Бахши 13 саволҳо дар бораи базаи **худи лоиҳа** аст, ки онҳоро ҳатман аз ёд кунед.

## Мундариҷа
1. [Асосҳо](#1-асосҳо-basics) (1–12)
2. [SELECT ва filtering](#2-select-ва-filtering) (13–24)
3. [JOIN](#3-join) (25–36)
4. [Aggregation ва GROUP BY](#4-aggregation-ва-group-by) (37–46)
5. [Subquery ва CTE](#5-subquery-ва-cte) (47–54)
6. [Window functions](#6-window-functions) (55–62)
7. [Keys ва constraints](#7-keys-ва-constraints) (63–72)
8. [Normalization ва design](#8-normalization-ва-design) (73–80)
9. [Indexes ва performance](#9-indexes-ва-performance) (81–92)
10. [Transactions ва concurrency](#10-transactions-ва-concurrency) (93–102)
11. [PostgreSQL](#11-postgresql) (103–110)
12. [Security ва ORM](#12-security-ва-orm) (111–116)
13. [Базаи худи лоиҳа](#13-базаи-худи-лоиҳа) (117–125)

---

## 1. Асосҳо (Basics)

**1. SQL чист?**
**SQL (Structured Query Language)** забони кор бо базаҳои relational аст: гирифтан, илова, тағйир ва нест кардани маълумот.

**2. Relational database чист?**
Базае, ки маълумотро дар **table**-ҳо (сатр ва сутун) нигоҳ медорад. Table-ҳо бо **key**-ҳо ба ҳам пайваст мешаванд.

**3. DBMS / RDBMS чист?**
**Database Management System**, барномае, ки базаро идора мекунад. **RDBMS** барои базаи relational аст: PostgreSQL, MySQL, SQL Server, Oracle.

**4. Гурӯҳҳои фармонҳои SQL?**
- **DDL (Data Definition Language):** `CREATE`, `ALTER`, `DROP`, `TRUNCATE`. Сохторро тағйир медиҳанд.
- **DML (Data Manipulation Language):** `SELECT`, `INSERT`, `UPDATE`, `DELETE`. Бо маълумот кор мекунанд.
- **DCL (Data Control Language):** `GRANT`, `REVOKE`. Ҳуқуқҳо.
- **TCL (Transaction Control Language):** `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`.

**5. Table, row, column?**
**Table** ҷадвал аст, **row (record)** як сабт ва **column (field)** як хосият, масалан `name`.

**6. Schema чист?**
Сохтори база: table-ҳо, column-ҳо, type-ҳо, constraint-ҳо ва муносибатҳо. Дар PostgreSQL **schema** инчунин namespace аст (масалан `public`).

**7. Data type-ҳои асосӣ?**
`INTEGER`, `BIGINT`, `NUMERIC`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `DATE`, `TIMESTAMPTZ`, `UUID`, `JSONB` (дар PostgreSQL).

**8. `NULL` чист?**
Арзиши «номаълум» ё «нест». `NULL` ба ҳеҷ чиз баробар нест, ҳатто ба `NULL`. Бинобар ин `= NULL` не, балки `IS NULL` ё `IS NOT NULL` навишта мешавад.

**9. `DELETE`, `TRUNCATE` ва `DROP` чӣ фарқ доранд?**
- `DELETE` сатрҳоро нест мекунад. Бо `WHERE` кор мекунад ва дар transaction бозгашт дорад.
- `TRUNCATE` ҳамаи сатрҳоро тез нест мекунад, бе `WHERE`.
- `DROP` худи table-ро бо сохтораш нест мекунад.

**10. `CHAR` ва `VARCHAR`?**
`CHAR(n)` дарозии собит дорад ва бо фосила пур мешавад. `VARCHAR(n)` дарозии тағйирёбанда дорад, то ҳадди `n`. Дар PostgreSQL `TEXT` ва `VARCHAR` аз ҷиҳати суръат якхелаанд.

**11. Тартиби иҷрои query (logical order)?**
`FROM` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`.
Бинобар ин alias-и `SELECT`-ро дар `WHERE` истифода бурдан мумкин нест, вале дар `ORDER BY` мумкин аст.

**12. `UNION` ва `UNION ALL`?**
`UNION` натиҷаи ду query-ро якҷоя мекунад ва такрориҳоро нест мекунад, ки сусттар аст. `UNION ALL` такрориҳоро нигоҳ медорад ва тезтар аст.

---

## 2. SELECT ва filtering

**13. `WHERE` чист?**
Сатрҳоро пеш аз group кардан филтр мекунад: `SELECT * FROM career WHERE "clusterId" = 1;`

**14. `AND`, `OR`, `NOT` ва қавс?**
`AND` аз `OR` пеш иҷро мешавад. Барои равшанӣ қавс гузоред: `WHERE a = 1 AND (b = 2 OR c = 3)`.

**15. `IN` ва `BETWEEN`?**
- `WHERE city IN ('Душанбе', 'Хуҷанд')` яке аз рӯйхат.
- `WHERE fee BETWEEN 3000 AND 8000` дар фосила, ҳарду канор дохил.

**16. `LIKE` ва `ILIKE`?**
`LIKE` бо namunа кор мекунад: `%` ҳар чанд аломат ва `_` як аломат. `ILIKE` (PostgreSQL) ҳамон аст, вале бе фарқи ҳарфи калон ва хурд.

**17. `DISTINCT` чист?**
Сатрҳои такрориро аз натиҷа нест мекунад: `SELECT DISTINCT city FROM universities;`

**18. `ORDER BY`?**
Тартиб медиҳад: `ASC` (пешфарз) ё `DESC`. Дар PostgreSQL метавон `NULLS FIRST` ё `NULLS LAST` гуфт.

**19. `LIMIT` ва `OFFSET` (pagination)?**
`LIMIT 10 OFFSET 20` саҳифаи сеюм аст. Дар саҳифаҳои дур `OFFSET` суст мешавад. Он гоҳ **keyset pagination** беҳтар аст: `WHERE id > :lastId ORDER BY id LIMIT 10`.

**20. `CASE` чист?**
Шарт дар дохили query: `CASE WHEN fee IS NULL THEN 'ройгон' ELSE 'пулакӣ' END`.

**21. `COALESCE` чист?**
Аввалин арзиши ғайри `NULL`-ро бармегардонад: `COALESCE("updatedAt", "createdAt")`. Дар лоиҳа истифода шудааст.

**22. `NULLIF` чист?**
Агар ду арзиш баробар бошанд, `NULL` бармегардонад. Барои пешгирии тақсим ба 0: `a / NULLIF(b, 0)`.

**23. Alias чист?**
Номи муваққатӣ: `SELECT name AS career_name FROM career c`.

**24. `EXISTS` ва `IN`?**
`EXISTS` танҳо месанҷад, ки сатр ҳаст ё не, ва дар ёфтани аввалин сатр бозмеистад. Барои subquery-и калон аксар вақт тезтар аст. `NOT IN` бо `NULL` хатарнок аст: агар дар рӯйхат `NULL` бошад, натиҷа холӣ мешавад. Бинобар ин `NOT EXISTS` беҳтар аст.

---

## 3. JOIN

**25. JOIN чист?**
Сатрҳои ду ё зиёда table-ро бо шарт (`ON`) якҷоя мекунад.

**26. `INNER JOIN`?**
Танҳо сатрҳое, ки дар ҳарду table мувофиқ доранд.

**27. `LEFT JOIN`?**
Ҳамаи сатрҳои table-и чап. Аз рост агар мувофиқ набошад, `NULL`.
Мисол аз лоиҳа: `career LEFT JOIN cluster`, то ихтисоси бе кластер ҳам биёяд.

**28. `RIGHT JOIN`?**
Баръакси `LEFT`. Дар амал кам истифода мешавад, чунки table-ҳоро ҷой иваз карда `LEFT` навиштан фаҳмотар аст.

**29. `FULL OUTER JOIN`?**
Ҳамаи сатрҳо аз ҳарду тараф, ва дар ҷое ки мувофиқ нест, `NULL`.

**30. `CROSS JOIN`?**
Ҳар сатр бо ҳар сатр (Cartesian product). 10 × 10 = 100 сатр.

**31. Self join?**
Table бо худаш. Масалан корманд ва роҳбараш дар як table: `employees e JOIN employees m ON e.manager_id = m.id`.

**32. Ёфтани сатрҳое, ки ҷуфт надоранд (anti-join)?**
`LEFT JOIN ... WHERE right.id IS NULL` ё `NOT EXISTS`. Масалан ихтисосҳое, ки ягон донишгоҳ надоранд.

**33. Шарт дар `ON` ва дар `WHERE` барои `LEFT JOIN`?**
Шарт дар `ON` танҳо table-и ростро филтр мекунад ва сатрҳои чап мемонанд. Шарт дар `WHERE` баъди join иҷро мешавад ва метавонад `LEFT JOIN`-ро ба `INNER` табдил диҳад.

**34. Many-to-many чӣ тавр сохта мешавад?**
Бо **junction table** (ҷадвали пайвандӣ). Дар лоиҳа `career_offerings` ихтисос ва донишгоҳро мепайвандад ва маълумоти иловагӣ дорад: нарх, ҷой, шакл, забон.

**35. `LATERAL JOIN` (PostgreSQL)?**
Subquery дар `FROM`, ки ба сутунҳои table-и пешина дастрасӣ дорад, монанди `CROSS APPLY` дар SQL Server. Дар лоиҳа барои кушодани рӯйхати JSON истифода шудааст: `CROSS JOIN LATERAL jsonb_array_elements_text(...)`.

**36. Чаро JOIN метавонад сатрҳоро «зиёд» кунад?**
Агар муносибат one-to-many бошад, ҳар сатри чап ба чанд сатр табдил меёбад. Барои ҳамин баъди JOIN `COUNT(DISTINCT ...)` лозим мешавад.

---

## 4. Aggregation ва GROUP BY

**37. Aggregate function-ҳо?**
`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Аз чанд сатр як арзиш медиҳанд.

**38. `COUNT(*)`, `COUNT(column)`, `COUNT(DISTINCT column)`?**
`COUNT(*)` ҳамаи сатрҳоро ҳисоб мекунад. `COUNT(column)` сатрҳоеро, ки `NULL` нестанд. `COUNT(DISTINCT column)` арзишҳои гуногунро.

**39. `GROUP BY`?**
Сатрҳоро аз рӯи сутун гурӯҳбандӣ мекунад: `SELECT city, COUNT(*) FROM universities GROUP BY city;`

**40. `WHERE` ва `HAVING`?**
`WHERE` сатрҳоро **пеш** аз group филтр мекунад. `HAVING` гурӯҳҳоро **баъд** аз aggregate филтр мекунад: `HAVING COUNT(*) > 5`.

**41. Чаро сутуни бе aggregate бояд дар `GROUP BY` бошад?**
Барои ҳар гурӯҳ як сатр мебарояд. Агар сутун дар гурӯҳ чанд арзиш дошта бошад, база намедонад кадомашро нишон диҳад.

**42. `FILTER (WHERE ...)` (PostgreSQL)?**
Aggregate бо шарт: `COUNT(*) FILTER (WHERE "paymentType" = 'ройгон')`. Дар лоиҳа барои ҳисоби ҷойҳои буҷетӣ ва омори синф истифода шудааст. Эквиваленти он `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` аст.

**43. `string_agg` / `STRING_AGG`?**
Сатрҳоро ба як матн якҷоя мекунад: `string_agg(DISTINCT un.name, '; ')`. Дар лоиҳа барои рӯйхати донишгоҳҳои ихтисос истифода шудааст.

**44. `bool_or` / `bool_and`?**
Aggregate барои `BOOLEAN`: «ақаллан як» ё «ҳама». Дар лоиҳа санҷида мешавад, ки ихтисос дар шаҳри хонанда ҷой дорад ё не.

**45. `AVG` ва `NULL`?**
`AVG` сатрҳои `NULL`-ро ба ҳисоб намегирад. Агар `NULL` бояд 0 бошад: `AVG(COALESCE(x, 0))`.

**46. `GROUP BY ROLLUP` / `CUBE`?**
Ҷамъбастҳои зина ба зина (subtotal ва grand total) дар як query.

---

## 5. Subquery ва CTE

**47. Subquery чист?**
Query дар дохили query: дар `WHERE`, `FROM` ё `SELECT`.

**48. Correlated subquery?**
Subquery, ки ба сатри query-и беруна вобаста аст ва барои ҳар сатр иҷро мешавад. Метавонад суст бошад. Мисол аз лоиҳа: `(SELECT count(*) FROM career_offerings o WHERE o."careerId" = c.id)`.

**49. Scalar subquery?**
Subquery, ки танҳо як арзиш (як сатр, як сутун) бармегардонад.

**50. CTE (Common Table Expression) чист?**
`WITH name AS (SELECT ...) SELECT ... FROM name`. Query-и мураккабро ба қисмҳои фаҳмо тақсим мекунад.

**51. Recursive CTE?**
`WITH RECURSIVE` барои сохторҳои дарахтӣ: категорияҳо, роҳбарон ва ғайра. Қисми асосӣ + `UNION ALL` + қисми рекурсивӣ.

**52. CTE ва subquery: кадомаш тезтар?**
Дар PostgreSQL 12+ CTE-и оддӣ мисли subquery оптимизатсия мешавад (inline). `MATERIALIZED` маҷбур мекунад, ки якбора ҳисоб шавад.

**53. Derived table?**
Subquery дар `FROM`, ки alias дорад: `SELECT * FROM (SELECT ...) AS t`.

**54. Temporary table ва CTE?**
Temporary table то охири session ё transaction мемонад ва индекс дошта метавонад. CTE танҳо дар як query мавҷуд аст.

---

## 6. Window functions

**55. Window function чист?**
Ҳисоб аз рӯи «тиреза»-и сатрҳо **бе** якҷоя кардани онҳо. Ҳар сатр мемонад: `SUM(x) OVER (PARTITION BY city)`.

**56. `GROUP BY` ва window function?**
`GROUP BY` сатрҳоро ба як сатр меорад. Window function ҳар сатрро нигоҳ медорад ва ба он ҳисоби иловагӣ илова мекунад.

**57. `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`?**
Масалан холҳо 100, 90, 90, 80:
- `ROW_NUMBER` 1, 2, 3, 4 медиҳад;
- `RANK` 1, 2, 2, 4;
- `DENSE_RANK` 1, 2, 2, 3.

**58. `PARTITION BY`?**
Window-ро ба гурӯҳҳо тақсим мекунад. Масалан рақам дар дохили ҳар кластер: `ROW_NUMBER() OVER (PARTITION BY "clusterId" ORDER BY name)`.

**59. Top-N дар ҳар гурӯҳ?**
`ROW_NUMBER() OVER (PARTITION BY g ORDER BY score DESC)` ва баъд `WHERE rn <= 3`. Дар PostgreSQL инчунин `DISTINCT ON` ҳаст.

**60. `DISTINCT ON` (PostgreSQL)?**
Аз ҳар гурӯҳ сатри аввалро аз рӯи `ORDER BY` мегирад. Дар лоиҳа барои охирин кӯшиши «Худро дар касб санҷед»-и ҳар ихтисос: `DISTINCT ON (t."careerId") ... ORDER BY t."careerId", t."createdAt" DESC`.

**61. `LAG()` ва `LEAD()`?**
Арзиши сатри пешина ё навбатӣ. Масалан тағйири бали гузариш аз соли гузашта.

**62. Running total?**
`SUM(x) OVER (ORDER BY date)`: ҷамъи пайдарпай.

---

## 7. Keys ва constraints

**63. Primary key?**
Шиносаи ягонаи сатр: `UNIQUE` + `NOT NULL`. Дар ҳар table як primary key ҳаст. Дар лоиҳа `uuid` бо `gen_random_uuid()`.

**64. Foreign key?**
Сутуне, ки ба primary key-и table-и дигар ишора мекунад ва **referential integrity**-ро таъмин мекунад: сабти «ятим» намемонад.

**65. `ON DELETE CASCADE`?**
Агар сатри асосӣ нест шавад, сатрҳои вобаста ҳам нест мешаванд. Дар лоиҳа: `parent_notes."inviteId" REFERENCES parent_invites(id) ON DELETE CASCADE`. Пайванди волид нест шавад, ёддоштҳо ҳам нест мешаванд.

**66. Дигар амалҳои foreign key?**
`RESTRICT` / `NO ACTION` нест карданро манъ мекунад. `SET NULL` ишораро `NULL` мекунад. `SET DEFAULT` арзиши пешфарзро мегузорад.

**67. `UNIQUE` constraint?**
Арзишҳои такрориро манъ мекунад. Дар лоиҳа рамзи пайванди волид `code varchar(10) NOT NULL UNIQUE` аст.

**68. Composite key?**
Key аз ду ё зиёда сутун. Дар лоиҳа як омӯзгор дар як синф як бор: `UNIQUE ("classroomId", "teacherId")`.

**69. `CHECK` constraint?**
Шарти арзиш: `CHECK (score BETWEEN 0 AND 40)`.

**70. `NOT NULL` ва `DEFAULT`?**
`NOT NULL` холӣ буданро манъ мекунад. `DEFAULT` арзиши пешфарз медиҳад, масалан `DEFAULT now()`.

**71. Surrogate key ва natural key?**
**Natural key** аз худи маълумот аст, масалан рамзи ихтисос. **Surrogate key** сунъӣ аст, масалан `id uuid`. Surrogate беҳтар аст, чунки рамзи табиӣ метавонад иваз шавад ё такрор ояд. Дар маълумоти ММТ як ном дар чанд рамз ҳаст.

**72. UUID ва auto-increment `INT`?**
UUID-ро пешакӣ тахмин кардан мумкин нест (амният) ва дар якчанд сервер бе бархӯрд сохтан мумкин аст. Вале UUID калонтар аст ва индексаш сусттар. `SERIAL` / `IDENTITY` хурд ва тез аст.

---

## 8. Normalization ва design

**73. Normalization чист?**
Тақсими маълумот ба table-ҳо, то такрор (redundancy) ва номувофиқӣ (anomaly) набошад.

**74. 1NF?**
Ҳар ячейка як арзиш дорад (atomic) ва гурӯҳҳои такрорӣ нестанд.

**75. 2NF?**
1NF + ҳар сутуни ғайрикалидӣ аз **тамоми** key вобаста аст, на аз қисми он. Ин барои composite key муҳим аст.

**76. 3NF?**
2NF + вобастагии **transitive** нест: сутуни ғайрикалидӣ набояд аз сутуни ғайрикалидии дигар вобаста бошад. Масалан номи шаҳр дар table-и донишгоҳ, на дар ҳар `career_offerings`.

**77. Denormalization кай лозим аст?**
Барои суръат: ҳисобҳои тайёр ё нусхаи майдон, то JOIN-и зиёд набошад. Дар лоиҳа пешгӯии AI дар `career_future` кеш карда мешавад ва ҳар бор сохта намешавад.

**78. ER diagram?**
Нақшаи entity-ҳо (table-ҳо), attribute-ҳо ва relationship-ҳо: one-to-one, one-to-many, many-to-many.

**79. Муносибатҳо: one-to-one, one-to-many, many-to-many?**
Аз лоиҳа:
- кластер → ихтисосҳо one-to-many аст;
- ихтисос ↔ донишгоҳ many-to-many аст, тавассути `career_offerings`;
- ихтисос → санҷиши касб (`career_trials`) one-to-one аст.

**80. JSON дар relational DB кай дуруст аст?**
Барои маълумоти нимсохторӣ, ки кам филтр мешавад: тарҷумаҳо (`translations jsonb`), сенарияи санҷиш, ҷавобҳои тест. Барои маълумоте, ки аз рӯи он JOIN ё филтр мекунед, сутуни алоҳида беҳтар аст.

---

## 9. Indexes ва performance

**81. Index чист?**
Сохтори иловагӣ (асосан **B-tree**), ки ҷустуҷӯро тез мекунад, мисли мундариҷаи китоб. Бе index база **full table scan** мекунад.

**82. Нархи index?**
Ҷой дар диск мегирад ва `INSERT`, `UPDATE` ва `DELETE`-ро суст мекунад, чунки index ҳам нав мешавад.

**83. Clustered ва non-clustered index (SQL Server)?**
**Clustered** тартиби физикии сатрҳо аст ва дар ҳар table танҳо як дона ҳаст. **Non-clustered** сохтори алоҳида бо ишора ба сатр аст. Дар PostgreSQL ҳамаи index-ҳо монанди non-clustered ҳастанд (heap table). `CLUSTER` як бор тартиб медиҳад.

**84. Composite index ва тартиби сутунҳо?**
Index аз чап ба рост кор мекунад (**leftmost prefix**). Index-и `("inviteId", "createdAt")` барои `WHERE "inviteId" = ? ORDER BY "createdAt"` кор мекунад, вале барои танҳо `"createdAt"` не. Ин index дар лоиҳа ҳаст.

**85. Covering index?**
Index, ки ҳамаи сутунҳои лозимиро дорад ва база ба table намеравад (**index-only scan**). Дар PostgreSQL: `CREATE INDEX ... INCLUDE (col)`.

**86. Partial index (PostgreSQL)?**
Index танҳо барои қисми сатрҳо: `CREATE INDEX ... WHERE archived = false`. Хурд ва тез аст.

**87. Кай index кор намекунад?**
- функсия дар сутун: `WHERE lower(name) = ...`, агар index-и функсионалӣ набошад;
- `LIKE '%abc'`, ки бо `%` оғоз мешавад;
- type-ҳои номувофиқ;
- агар query қисми калони table-ро гирад, база scan-ро интихоб мекунад.

**88. `EXPLAIN` ва `EXPLAIN ANALYZE`?**
`EXPLAIN` нақшаи иҷроро нишон медиҳад (Seq Scan, Index Scan, Hash Join, Nested Loop). `EXPLAIN ANALYZE` query-ро воқеан иҷро мекунад ва вақти воқеиро нишон медиҳад.

**89. Навъҳои JOIN дар план?**
- **Nested Loop:** барои table-ҳои хурд ё бо index.
- **Hash Join:** барои table-ҳои калон бо баробарӣ.
- **Merge Join:** барои маълумоти тартибдодашуда.

**90. N+1 problem?**
Як query барои рӯйхат ва баъд N query барои ҳар сатр. Ҳал: JOIN, `IN (...)` ё eager loading дар ORM (`Include` дар EF, `relations` дар TypeORM).

**91. Чаро `SELECT *` бад аст?**
Маълумоти нолозим мегирад, index-only scan-ро манъ мекунад ва ҳангоми тағйири table рафтор иваз мешавад.

**92. Чӣ тавр query-и сустро тез мекунед?**
1. `EXPLAIN ANALYZE`.
2. Index-и мувофиқ.
3. Камтар сатр ва сутун гирифтан.
4. Пешгирии функсия дар `WHERE`.
5. Пешгирии N+1.
6. Кеш (дар лоиҳа: саҳифаҳои тайёр, кеши овоз ва пешгӯӣ).

---

## 10. Transactions ва concurrency

**93. Transaction чист?**
Гурӯҳи амалҳо, ки ё ҳамааш иҷро мешавад ё ҳеҷ кадом: `BEGIN ... COMMIT` ё `ROLLBACK`.

**94. ACID?**
- **Atomicity:** ҳама ё ҳеҷ.
- **Consistency:** база аз як ҳолати дуруст ба ҳолати дуруст мегузарад, ва қоидаҳо ва constraint-ҳо риоя мешаванд.
- **Isolation:** transaction-ҳои ҳамзамон ба ҳамдигар халал намерасонанд.
- **Durability:** баъди `COMMIT` маълумот ҳатто ҳангоми қатъи барқ мемонад (WAL).

**95. Isolation level-ҳо?**
`READ UNCOMMITTED`, `READ COMMITTED` (пешфарз дар PostgreSQL ва SQL Server), `REPEATABLE READ` ва `SERIALIZABLE`.

**96. Dirty read, non-repeatable read, phantom read?**
- **Dirty read:** хондани маълумоти ҳанӯз commit-нашуда.
- **Non-repeatable read:** ҳамон сатр дар ду хондан гуногун аст.
- **Phantom read:** дар ду хондан сатрҳои нав пайдо мешаванд.

**97. MVCC (PostgreSQL)?**
**Multi-Version Concurrency Control:** ҳар transaction «акси» худи базаро мебинад. Хонанда нависандаро намебандад ва баръакс. Нусхаҳои кӯҳна бо **VACUUM** тоза мешаванд.

**98. Lock ва deadlock?**
**Lock** сатр ё table-ро барои дигарон мебандад. **Deadlock** вақте аст, ки ду transaction ҳар кадом lock-и дигареро интизоранд. База якеро бекор мекунад. Барои пешгирӣ ҳамеша ба як тартиб lock гиред.

**99. Optimistic ва pessimistic locking?**
**Pessimistic:** `SELECT ... FOR UPDATE`, сатр баста мешавад. **Optimistic:** сутуни `version` ё `rowversion`, ва ҳангоми `UPDATE` санҷида мешавад, ки касе пеш аз мо тағйир надодааст. EF Core ин корро бо `[ConcurrencyCheck]` мекунад.

**100. Upsert?**
«Агар ҳаст, нав кун; агар нест, илова кун». Дар PostgreSQL: `INSERT ... ON CONFLICT (key) DO UPDATE SET ...`. Дар SQL Server: `MERGE`. Дар лоиҳа ин ҳангоми илова кардани омӯзгор ба синф ва кеши пешгӯӣ истифода мешавад.

**101. Race condition дар база чӣ тавр ҳал мешавад?**
Бо `UNIQUE` constraint ва `ON CONFLICT`, ки беҳтарин роҳ аст, бо `FOR UPDATE` ё бо transaction ва isolation-и баланд. Дар лоиҳа рамзи пайванд бо `UNIQUE` санҷида мешавад: агар такрор шавад, рамзи нав сохта мешавад.

**102. `SAVEPOINT`?**
Нуқтаи бозгашт дар дохили transaction: `ROLLBACK TO SAVEPOINT x`.

---

## 11. PostgreSQL

**103. Чаро PostgreSQL?**
Ройгон ва open-source, боэътимод (ACID ва MVCC), бо `JSONB`, `UUID`, window functions, `FILTER`, `DISTINCT ON`, `LATERAL` ва ҷустуҷӯи матн.

**104. `JSON` ва `JSONB`?**
`JSON` матнро айнан нигоҳ медорад. `JSONB` бинарӣ аст: тезтар хонда мешавад, index (GIN) дорад ва операторҳо `->`, `->>`, `@>` доранд. Дар лоиҳа `JSONB` истифода мешавад.

**105. Операторҳои JSONB?**
- `->` объект бармегардонад;
- `->>` матн бармегардонад: `translations->'ru'->>'name'`;
- `@>` «дар бар мегирад»;
- `jsonb_array_elements` массивро ба сатрҳо табдил медиҳад.

**106. GIN index?**
Index барои `JSONB`, массивҳо ва full-text search.

**107. `SERIAL` ва `IDENTITY`?**
Ҳарду рақами худкор медиҳанд. `GENERATED ... AS IDENTITY` стандарти SQL ва тавсияи нав аст.

**108. `VACUUM` ва `ANALYZE`?**
`VACUUM` ҷойи сатрҳои кӯҳнаро (аз MVCC) озод мекунад. `ANALYZE` омори table-ро барои планировщик нав мекунад. Autovacuum инро худкор мекунад.

**109. `pg_dump`?**
Нусхаи эҳтиётии база. Дар лоиҳа пеш аз ҳар тағйири хатарнок `pg_dump` гирифта мешавад.

**110. `translate()` ва ҷустуҷӯ бо ҳарфҳои тоҷикӣ?**
Дар лоиҳа барои ҷустуҷӯ ҳарфҳои тоҷикӣ ба оддӣ иваз мешаванд: `translate(lower(name), 'ғӣқӯҳҷ', 'гикухч')`. Ҳамин тавр «хукук» ҳам «ҳуқуқ»-ро меёбад. Барои суръат дар оянда index-и функсионалӣ бо ҳамин ифода сохтан мумкин аст.

---

## 12. Security ва ORM

**111. SQL injection чист?**
Вақте ки матни корбар ба SQL часпонида мешавад ва ҳамчун фармон иҷро мешавад: `' OR 1=1 --`.

**112. Чӣ тавр пешгирӣ мекунед?**
**Parameterized query (prepared statement):** `WHERE id = $1` ва арзиш алоҳида фиристода мешавад. Дар лоиҳа ҳамаи SQL-и дастӣ параметрнок аст. TypeORM QueryBuilder ҳам параметр истифода мебарад (`:id`). Дар C# ин `SqlParameter` ё EF аст.

**113. Principle of least privilege?**
Корбари база танҳо ҳуқуқҳои лозимиро дорад, масалан барномаи веб `DROP` карда наметавонад.

**114. ORM чист? Афзалият ва камбудӣ?**
**Object-Relational Mapping:** table ба class мегардад (TypeORM, EF Core, Hibernate).
- **Афзалият:** зуд навишта мешавад, type safety дорад ва аз SQL injection муҳофизат мекунад.
- **Камбудӣ:** метавонад SQL-и суст созад (N+1) ва query-ҳои мураккаб душвор мешаванд.

Дар лоиҳа барои CRUD TypeORM ва барои омори мураккаб SQL-и параметрнок истифода мешавад.

**115. TypeORM ва Entity Framework?**
Ҳарду ORM ҳастанд: entity бо decorator (`@Entity`, `@Column`) ё attribute, repository, QueryBuilder (дар EF LINQ), migration ва eager/lazy loading. Кор бо онҳо қариб якхела аст.

**116. Migration чист?**
Тағйири версиядори сохтори база (дар EF `Add-Migration`, дар TypeORM `migration:generate`). Дар лоиҳа ҷадвалҳои нав ҳоло бо `CREATE TABLE IF NOT EXISTS` ҳангоми оғоз сохта мешаванд. Ин содда аст, вале барои лоиҳаи калон migration-ҳои расмӣ беҳтаранд. Ин қадами навбатист.

---

## 13. Базаи худи лоиҳа

**117. Ҷадвалҳои асосии лоиҳа?**
- `career`: ихтисосҳо, бо `translations jsonb`;
- `cluster`: 5 кластери ММТ;
- `universities`;
- `career_offerings`: донишгоҳ + ихтисос + шакл + забон + нарх + ҷой + `"basedOn"` (синфи 9 ё 11);
- `user`;
- `quiz_attempts`;
- `classrooms`, `classroom_messages`;
- `parent_invites`, `parent_notes`;
- `career_trials`, `career_future`;
- `teacher_requests`.

**118. Чаро `career_offerings` table-и алоҳида аст?**
Як ихтисос дар донишгоҳҳои гуногун бо шартҳои гуногун меояд (нарх, ҷой, шакл, забон). Ин муносибати many-to-many бо attribute-ҳост ва дар як table-и ихтисос ҷой намегирад.

**119. Ҷойҳои буҷетии ихтисос чӣ тавр ҳисоб мешаванд?**
```sql
SELECT count(*) FILTER (WHERE "paymentType" = 'ройгон') AS free,
       count(DISTINCT "universityId") AS places,
       min("tuitionFee") FILTER (WHERE "tuitionFee" > 0) AS "minFee"
FROM career_offerings WHERE "careerId" = $1;
```

**120. Индексҳо дар лоиҳа?**
Барои ҷустуҷӯҳои зуд-зуд:
- `quiz_attempts ("userId")` ва `("guestId")`;
- `classrooms ("teacherId")`;
- `classroom_messages ("memberId", "createdAt")`;
- `parent_notes ("inviteId", "createdAt")`.

**121. Маълумоти кӯҳна чӣ тавр тоза мешавад?**
Ҳангоми оғози сервер: `DELETE FROM parent_invites WHERE COALESCE("updatedAt", "createdAt") < now() - interval '90 days'`. Ёддоштҳо бо `ON DELETE CASCADE` худашон нест мешаванд.

**122. Калиди фарзанд чӣ тавр нигоҳ дошта мешавад?**
Худи калид не, балки hash-и он (SHA-256) дар сутуни `"secretHash"`. Ҳатто агар база дуздида шавад, калидро барқарор кардан мумкин нест.

**123. Омори синф чӣ тавр сохта мешавад?**
Бо як query бо `JOIN`, `GROUP BY` ва `FILTER (WHERE ...)`: чанд хонанда тестро гузашт ва тақсимот аз рӯи кластерҳо. Ин аз N query барои ҳар хонанда тезтар аст.

**124. Интихоби ихтисосҳо дар SQL аст ё дар код?**
Ҳавзи ихтисосҳо бо SQL гирифта мешавад: аз як кластер ва барои синфи 9 танҳо бо пешниҳоди «баъди синфи 9». Хол аз рӯи калидвожаҳо дар код (TypeScript) ҳисоб мешавад, чунки он мантиқи барнома аст ва бо тестҳои jest санҷида мешавад.

**125. Агар маълумот 100 маротиба зиёд шавад, чӣ мекунед?**
1. `EXPLAIN ANALYZE` барои query-ҳои асосӣ.
2. Index-ҳои иловагӣ: функсионалӣ барои ҷустуҷӯи тоҷикӣ ва GIN барои `JSONB`.
3. Pagination-и keyset.
4. Кеши Redis.
5. Read replica барои хондан.
6. Migration-ҳои расмӣ.

---

**Маслиҳат:** ҳакам аксар вақт аз савол ба мисоли худи лоиҳа мегузарад: «Дар лоиҳаи худатон куҷо ин ҳаст?». Барои ҳамин бахши 13 ва мисолҳои «дар лоиҳа…»-ро хубтар аз ёд кунед.
