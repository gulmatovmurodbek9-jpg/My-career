# Таҳлили пурраи лоиҳаи My Career

## Хулосаи кӯтоҳ

`My Career` платформаи веб барои роҳнамоии касбӣ мебошад. Лоиҳа ба ҷавонон ва довталабони Тоҷикистон ёрӣ медиҳад, ки ихтисос, донишгоҳ ва роҳи рушди касбии худро бо маълумоти сохторӣ, тестҳои равонӣ ва маслиҳати AI интихоб кунанд.

Система аз ду қисми асосӣ иборат аст:

- `Front`: интерфейси корбар бо React, Vite, Tailwind CSS, 3D-визуалҳо, харита ва панели админ.
- `Back/nest-backend`: сервери API бо NestJS, PostgreSQL, TypeORM, JWT-auth ва интегратсияи AI тавассути Groq/Gemini.

## Лоиҳа барои чӣ аст

Мақсади асосӣ: кӯмак ба корбар барои интихоби ихтисоси мувофиқ дар асоси қобилият, шавқ, кластерҳои ММТ, маълумоти касбҳо, донишгоҳҳо ва тавсияи зеҳни сунъӣ.

Платформа метавонад барои чунин гурӯҳҳо фоиданок бошад:

- хонандагони синфҳои болоӣ;
- довталабони донишгоҳ;
- донишҷӯёне, ки мехоҳанд роҳи касбии худро равшан кунанд;
- волидон ва мушовирони таълимӣ;
- админҳо, ки базаи ихтисосҳо, кластерҳо ва корбаронро идора мекунанд.

## Стек ва технологияҳо

### Frontend

- React 19
- Vite
- React Router 7
- Tailwind CSS
- Framer Motion
- Zustand
- Axios
- i18next / react-i18next
- Recharts
- Three.js, React Three Fiber, Drei
- Leaflet / React Leaflet
- Lucide React

### Backend

- NestJS 11
- TypeScript
- PostgreSQL
- TypeORM
- JWT ва Passport
- bcrypt
- Swagger
- class-validator / class-transformer
- cache-manager
- Groq SDK
- Google Generative AI SDK

## Сохтори асосии проект

```text
My Career/
  Back/
    nest-backend/
      src/
        ai/
        appointment/
        auth/
        career/
        cluster/
        quiz/
        university/
        users/
        app.module.ts
        main.ts
  Front/
    src/
      components/
      pages/
        about/
        admin/
        auth/
        careers/
        clusters/
        dashboard/
        favorites/
        home/
        info/
        layout/
        quiz/
        universities/
      lib/
      store/
      App.jsx
      main.jsx
```

## Функсияҳои асосии система

### 1. Сабти ном ва воридшавӣ

Backend модулҳои `auth` ва `users` дорад. Корбар метавонад сабти ном шавад, ворид шавад ва JWT token гирад. Паролҳо бо `bcrypt` hash мешаванд.

Функсияҳо:

- register;
- login/signin;
- гирифтани профили корбар;
- нақшҳои `user` ва `admin`;
- муҳофизати route-ҳо дар frontend.

### 2. Каталоги ихтисосҳо

Модули `career` базаи ихтисосҳоро нигоҳ медорад.

Функсияҳо:

- рӯйхати ихтисосҳо бо pagination;
- ҷустуҷӯ аз рӯи ном ва тавсиф;
- филтр аз рӯи cluster;
- филтр аз рӯи нархи таҳсил;
- филтр аз рӯи донишгоҳ;
- дидани маълумоти пурраи як ихтисос;
- лайк кардан;
- захира кардани ихтисос дар профили корбар;
- ҳисоб кардани ихтисосҳои мувофиқ аз рӯи натиҷаи тест;
- CRUD барои админ.

Маълумоти ихтисос метавонад чунин қисмҳо дошта бошад:

- ном;
- тавсиф;
- мақсад;
- малакаҳои техникӣ ва soft skills;
- технологияҳо;
- roadmap;
- мисолҳои project;
- манбаъҳои омӯзиш;
- имкониятҳои корӣ;
- маош ва бозор;
- сертификатҳо;
- донишгоҳҳои вобаста;
- cluster ва mmtCluster;
- арзиши таҳсил;
- давомнокии таҳсил;
- likesCount.

### 3. Кластерҳои ММТ

Модули `cluster` гурӯҳҳои ихтисосҳоро нигоҳ медорад. Ҳар cluster метавонад якчанд career дошта бошад.

Функсияҳо:

- рӯйхати cluster-ҳо бо ихтисосҳо;
- дидани як cluster;
- сохтан, навсозӣ ва нест кардан.

Қайд: ҳоло create/update/delete-и cluster дар backend guard надорад. Беҳтар аст ин endpoint-ҳо танҳо барои admin бошанд.

### 4. Тести касбӣ

Модули `quiz` саволҳоро медиҳад, ҷавобҳоро қабул мекунад ва натиҷаро ба кластерҳои ММТ табдил медиҳад.

Функсияҳо:

- гирифтани саволҳои random;
- ҳисоб кардани холҳо барои `c1` то `c5`;
- нигоҳ доштани натиҷаи тест барои корбари воридшуда;
- муайян кардани cluster-и беҳтарин;
- пешниҳоди ихтисосҳои мувофиқ;
- нишон додани профили равонӣ дар dashboard.

Frontend саҳифаи `/quiz` дорад, ки тестро бо progress, animation ва натиҷаи визуалӣ нишон медиҳад.

### 5. Dashboard-и корбар

Саҳифаи `/dashboard` маркази шахсии корбар аст.

Функсияҳо:

- нишон додани профили корбар;
- нишон додани натиҷаҳои тест;
- диаграммаи профили психологӣ;
- рӯйхати career match-ҳо;
- лайк ва save;
- гузариш ба AI advisor;
- гузариш ба career compare;
- дастрасӣ ба appointment panel.

### 6. AI Chat

Саҳифаи `/dashboard/ai-chat` ва endpoint-и `/careers/ask` барои саволҳои касбӣ истифода мешаванд.

Функсияҳо:

- савол додан ба AI;
- маҳдудияти 5 савол дар як рӯз барои user;
- admin бе маҳдудият;
- нигоҳ доштани таърихи chat;
- fallback аз Groq ба Gemini ҳангоми rate limit ё хатои provider.

Қайд: параметрҳои `careerName` ва `lang` дар controller қабул мешаванд, вале prompt-и backend ҳоло асосан танҳо `User asked: ...` мефиристад. Барои ҷавобҳои беҳтар, prompt бояд career context, забон ва маълумоти маҳаллии Тоҷикистонро пурра истифода барад.

### 7. AI Career Advisor

Endpoint-и `/careers/ai-advisor` аз натиҷаи тест гузориши сохтории AI месозад.

Натиҷаи интизоршаванда:

- таҳлили шахсият;
- тавсияҳои касбӣ;
- шарҳи сабаби мувофиқат;
- пешбинии эҳтимоли муваффақият;
- roadmap барои касби интихобшуда;
- topMatches аз база.

Ин функсия барои корбар арзиши баланд дорад, чун натиҷаи тестро ба нақшаи амалӣ табдил медиҳад.

### 8. Муқоисаи касбҳо

Саҳифаи `/dashboard/compare` ва endpoint-и `/careers/compare` имкон медиҳанд, ки корбар 2 ё зиёда ихтисосро бо AI муқоиса кунад.

Функсияҳо:

- муайян кардани беҳтарин интихоб;
- match percentage;
- pros ва cons;
- малакаҳои лозим;
- demand дар бозор;
- difficulty;
- salary range.

### 9. Донишгоҳҳо ва харита

Модули `university` ва саҳифаҳои `/universities` ва `/universities/:id` барои дидани донишгоҳҳо ва ихтисосҳои онҳо мебошанд.

Функсияҳо:

- рӯйхати донишгоҳҳо;
- ҷустуҷӯ аз рӯи ном, шаҳр ё shortName;
- намоиш дар харита;
- ҳисоб кардани шумораи ихтисосҳо;
- дидани маълумоти як донишгоҳ;
- дидани specialty-ҳои донишгоҳ.

### 10. Favorites

Саҳифаи `/favorites` ихтисосҳои лайкшуда ва захирашударо нишон медиҳад.

Backend барои ин функсияҳо endpoint дорад:

- `/users/liked-careers`;
- `/users/saved-careers`;
- `/users/save-career/:careerId`;
- `/careers/:id/like`.

### 11. Appointment / Машварат

Модули `appointment` барои навбат ва машварат сохта шудааст.

Намудҳо:

- `AI`;
- `ONLINE`;
- `OFFLINE`.

Status-ҳо:

- `PENDING`;
- `IN_PROGRESS`;
- `CONFIRMED`;
- `COMPLETED`;
- `CANCELLED`.

Функсияҳо:

- сохтани appointment;
- гирифтани appointment-ҳои худ;
- гирифтани як appointment;
- идоракунии appointment аз тарафи admin/specialist;
- update status;
- cancel;
- queue position;
- estimated wait time.

Қайд: дар `AppointmentController` аз `req.user.id` истифода шудааст, вале `JwtStrategy` объектро бо `userId` бармегардонад. Ин эҳтимолан сабаби кор накардани appointment endpoint-ҳо мешавад. Бояд ба `req.user.userId` иваз шавад ё strategy ҳам `id` баргардонад.

### 12. Панели админ

Frontend route-ҳои admin дорад:

- `/admin`;
- `/admin/careers`;
- `/admin/clusters`;
- `/admin/users`.

Функсияҳо:

- dashboard бо KPI;
- total users;
- total careers;
- total clusters;
- total likes;
- top liked careers;
- top saved careers;
- CRUD барои careers;
- CRUD барои clusters;
- идоракунии users;
- тағйири role;
- delete user.

## API-ҳои асосӣ

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/signin`

### Users

- `GET /api/users/profile`
- `GET /api/users`
- `DELETE /api/users/:id`
- `PATCH /api/users/:id/role`
- `POST /api/users/save-career/:careerId`
- `GET /api/users/saved-careers`
- `GET /api/users/liked-careers`
- `POST /api/users/quiz-results`
- `GET /api/users/chat-history`
- `GET /api/users/ai-usage`

### Careers

- `GET /api/careers`
- `GET /api/careers/stats`
- `GET /api/careers/:id`
- `POST /api/careers`
- `PUT /api/careers/:id`
- `DELETE /api/careers/:id`
- `DELETE /api/careers`
- `POST /api/careers/:id/like`
- `POST /api/careers/recalculate-likes`
- `POST /api/careers/match`
- `POST /api/careers/ask`
- `POST /api/careers/ai-advisor`
- `POST /api/careers/compare`

### Quiz

- `GET /api/quiz/questions`
- `POST /api/quiz/submit`
- `POST /api/quiz/submit-authenticated`

### Clusters

- `GET /api/clusters`
- `GET /api/clusters/:id`
- `POST /api/clusters`
- `PUT /api/clusters/:id`
- `DELETE /api/clusters/:id`

### Universities

- `GET /api/universities`
- `GET /api/universities/:id`
- `GET /api/universities/:id/specialties`

### Appointments

- `POST /api/appointments`
- `GET /api/appointments/my`
- `GET /api/appointments/:id`
- `GET /api/appointments`
- `PATCH /api/appointments/:id/status`
- `DELETE /api/appointments/:id`
- `GET /api/appointments/stats/:type`

## Ҷараёни корбар

1. Корбар сабти ном ё ворид мешавад.
2. Корбар тест мегузарад.
3. Система холҳоро ба кластерҳои ММТ табдил медиҳад.
4. Dashboard профили корбар ва ихтисосҳои мувофиқро нишон медиҳад.
5. Корбар ихтисосҳоро лайк ё save мекунад.
6. Корбар метавонад бо AI савол диҳад.
7. Корбар метавонад гузориши AI advisor гирад.
8. Корбар метавонад якчанд касбро муқоиса кунад.
9. Корбар донишгоҳҳо ва ихтисосҳои онҳоро мебинад.
10. Агар лозим бошад, корбар appointment барои машварат месозад.

## Ҷараёни админ

1. Admin ворид мешавад.
2. Ба `/admin` мегузарад.
3. Статистикаи умумиро мебинад.
4. Careers, clusters ва users-ро идора мекунад.
5. Ихтисосҳои нав илова мекунад ё маълумотро навсозӣ мекунад.
6. Role-и корбаронро тағйир медиҳад.

## Нуқтаҳои қавии проект

- Идеяи проект равшан ва барои Тоҷикистон мувофиқ аст.
- Full-stack сохта шудааст, танҳо frontend нест.
- Backend modular аст: ҳар feature module-и худро дорад.
- JWT, role guard ва admin panel мавҷуданд.
- AI integration бо fallback дорад.
- Dashboard, quiz, career compare ва advisor арзиши воқеии корбарӣ медиҳанд.
- Харитаи донишгоҳҳо проектро визуалӣ ва маҳаллӣ мекунад.
- Swagger documentation фаъол аст: `/api/docs`.
- Frontend UI дорои animation, chart, 3D ва state management аст.

## Мушкилот ва нуқтаҳои беҳтаркунӣ

### 1. Рамзгузории матнҳо вайрон шудааст

Дар бисёр файлҳо матни тоҷикӣ ҳамчун mojibake дида мешавад, мисол `РљР°СЃР±...`. Ин ба UI, README ва message-ҳои backend таъсир мерасонад.

Тавсия:

- ҳамаи файлҳоро UTF-8 нигоҳ доред;
- матнҳои тоҷикӣ, русӣ ва англисиро дар файлҳои алоҳидаи i18n ҷудо кунед;
- README-и тоҷикӣ аз нав бо UTF-8 навишта шавад;
- дар editor encoding-ро ба UTF-8 гузоред.

### 2. Номувофиқии портҳо

Backend дар `main.ts` default ба `3004` гӯш мекунад, вале frontend `.env` чунин аст:

```env
VITE_API_URL=http://localhost:3005/api
```

Агар backend дар 3004 бошад, frontend API-ро намеёбад.

Тавсия:

- ё backend `PORT=3005` дошта бошад;
- ё frontend `.env` ба `http://localhost:3004/api` иваз шавад;
- дар README як стандарти ягона навишта шавад.

### 3. Appointment endpoint эҳтимол bug дорад

`JwtStrategy` чунин user месозад:

```ts
return { userId: payload.sub, email: payload.email, role: payload.role };
```

Вале `AppointmentController` аз `req.user.id` истифода мекунад. Ин бояд мутобиқ шавад.

Тавсия:

- дар controller `req.user.userId` истифода шавад;
- ё дар strategy ҳам `id: payload.sub` илова шавад.

### 4. Cluster CRUD муҳофизат надорад

Career CRUD бо admin guard муҳофизат шудааст, вале cluster create/update/delete ҳоло public аст.

Тавсия:

- `@UseGuards(AuthGuard('jwt'), RolesGuard)`;
- `@Roles('admin')`;
- `@ApiBearerAuth()`.

### 5. Role-и `specialist` истифода мешавад, вале дар UserRole нест

Дар appointment admin endpoint чунин иҷозат ҳаст:

```ts
@Roles('admin', 'specialist')
```

Вале enum-и `UserRole` танҳо `user` ва `admin` дорад.

Тавсия:

- ё `SPECIALIST = 'specialist'` илова шавад;
- ё role-и specialist аз controller гирифта шавад.

### 6. Секретҳо ва fallback-ҳои хатарнок

Дар backend default password ва `JWT_SECRET || 'secretKey'` мавҷуд аст. Барои dev кор мекунад, аммо барои production хавфнок аст.

Тавсия:

- дар production агар `JWT_SECRET` набошад, app start нашавад;
- default DB password аз код гирифта шавад;
- `.env.example` сохта шавад;
- `.env` ба git дохил нашавад.

### 7. TypeORM synchronize

`synchronize` барои production false мешавад, ки хуб аст, вале migration нест.

Тавсия:

- migration-ҳои TypeORM илова кунед;
- seed script-ҳоро тоза ва стандарт кунед;
- schema change-ҳоро бо migration идора кунед.

### 8. AI prompt-ҳо бояд беҳтар шаванд

AI service хуб аст, аммо баъзе endpoint-ҳо context-ро пурра намефиристанд. Масалан `askAi` careerName ва lang-ро мегирад, вале prompt содда аст.

Тавсия:

- prompt-и structured созед;
- language instruction илова кунед;
- career context аз база гиред;
- ҷавобро бо bullet, roadmap ва next steps баргардонед;
- limit ва history-ро барои ҳама AI endpoint-ҳо яксон кунед.

### 9. Frontend i18n хеле калон ва такрорӣ шудааст

`src/lib/i18n.js` бисёр калон аст ва ҳатто key-ҳои такрорӣ дорад, мисол `quiz` чанд бор муайян шудааст.

Тавсия:

- `locales/tj.json`, `locales/ru.json`, `locales/en.json` созед;
- key-ҳои такрориро тоза кунед;
- namespace-ҳо ҷудо шаванд: `common`, `home`, `quiz`, `admin`, `dashboard`.

### 10. Санҷишҳо каманд ё истифода нашудаанд

Package scripts барои test мавҷуданд, вале дар project test-ҳои равшан дида намешаванд.

Тавсия:

- backend unit test барои auth, quiz scoring, career matching;
- e2e test барои login/register ва protected endpoints;
- frontend smoke test барои route-ҳои асосӣ;
- test барои appointment bug.

### 11. Build artifacts ва node_modules дар workspace зиёданд

Дар проект `dist` ва `node_modules` ҳастанд. Барои кор кардан хуб аст, вале барои repository набояд version control шаванд.

Тавсия:

- `.gitignore` дар backend ҳам илова/тафтиш шавад;
- `dist`, `node_modules`, log ва backup file-ҳо дар repository нигоҳ дошта нашаванд;
- data scripts дар папкаи `scripts/` ҷамъ карда шаванд.

## Пешниҳод барои беҳтар кардани проект

### Қадами 1: Стабилизатсия

- портҳои frontend/backend-ро яксон кунед;
- appointment userId bug-ро ислоҳ кунед;
- cluster CRUD-ро admin-only кунед;
- role-и specialist-ро муайян кунед;
- secret fallback-ҳоро барои production манъ кунед.

### Қадами 2: Тозакунии матн ва забонҳо

- encoding-и ҳамаи файлҳоро UTF-8 кунед;
- i18n-ро ба JSON file-ҳои ҷудо кӯчонед;
- README-и тоҷикӣ ва англисиро аз нав тоза кунед;
- ҳамаи message-ҳои backend-ро бо матни дуруст иваз кунед.

### Қадами 3: Қавитар кардани AI

- prompt template барои `ask`, `advisor`, `compare` созед;
- careerName ва lang-ро воқеан истифода баред;
- барои AI response schema validation илова кунед;
- агар AI JSON-и вайрон диҳад, fallback-и беҳтар созед;
- chat history-ро бо role/message format нигоҳ доред.

### Қадами 4: Маълумот ва matching

- алгоритми match-ро шаффофтар кунед;
- барои ҳар career профили cluster ва skill weight илова кунед;
- scoring-ро бо формулаи ягона дар backend нигоҳ доред;
- frontend reasoning modal-ро бо маълумоти воқеии backend пур кунед.

### Қадами 5: Production readiness

- migrations;
- `.env.example`;
- Docker Compose барои PostgreSQL ва API;
- rate limiting;
- request logging;
- centralized error handling;
- CI барои build/test.

## README-и беҳтаршуда бояд чӣ дошта бошад

README-и асосӣ метавонад чунин сохтор гирад:

1. Номи проект ва як ҷумлаи mission.
2. Скриншот ё demo.
3. Функсияҳои асосӣ.
4. Стек.
5. Сохтори папкаҳо.
6. Насб ва роҳандозӣ.
7. Environment variables.
8. API docs.
9. Scripts.
10. Data seeding.
11. Known issues.
12. Roadmap.

## Хулосаи умумӣ

Лоиҳаи `My Career` аз рӯи идея ва ҳаҷм хеле хуб аст: он танҳо каталог нест, балки системаи пурраи роҳнамоии касбӣ бо тест, AI, dashboard, донишгоҳҳо, favorite, appointment ва admin panel мебошад.

Барои қавитар шудан, аввал бояд масъалаҳои техникӣ ва сифатӣ ҳал шаванд: encoding, API port mismatch, appointment bug, guard-и cluster, role-и specialist ва тоза кардани i18n. Пас аз ин, беҳтарин самт ин қавитар кардани AI prompt-ҳо, matching algorithm ва production readiness мебошад.

Агар ин қадамҳо иҷро шаванд, проект метавонад ба як платформаи ҷиддӣ ва қобили истифода барои роҳнамоии касбии ҷавонони Тоҷикистон табдил ёбад.
