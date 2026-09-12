-- Корбарони намоишӣ, ки бо scripts/seed-demo-users.mjs сохта шудаанд.
-- Иҷро кунед, то пас аз намоиш ҳамаашонро тоза кунед.
DELETE FROM user_liked_careers WHERE "userId" IN (SELECT id FROM "user" WHERE email = ANY(ARRAY[
    'gulnora.ergasheva438@gmail.com',
    'lola.berdieva61@gmail.com',
    'nasiba.abdulloeva251@gmail.com'
]));
DELETE FROM user_saved_careers WHERE "userId" IN (SELECT id FROM "user" WHERE email = ANY(ARRAY[
    'gulnora.ergasheva438@gmail.com',
    'lola.berdieva61@gmail.com',
    'nasiba.abdulloeva251@gmail.com'
]));
DELETE FROM "user" WHERE email = ANY(ARRAY[
    'gulnora.ergasheva438@gmail.com',
    'lola.berdieva61@gmail.com',
    'nasiba.abdulloeva251@gmail.com'
]);
