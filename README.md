# My Career

Платформаи роҳнамоии касбӣ барои хонандагони Тоҷикистон. Тест мегузаронад, кластери
мувофиқро муайян мекунад ва нишон медиҳад, ки кадом ихтисос дар кадом донишгоҳ, бо
кадом нарх ва шакли таҳсил дастрас аст.

Маълумот аз рӯйхати расмии Маркази миллии тестӣ (МНТ) сохта шудааст:
**5 кластер · 128 муассисаи таълимӣ · 884 ихтисос · 5997 пешниҳод**.

## Сохтор

| Папка | Чӣ аст | Технология |
|---|---|---|
| `Back/nest-backend` | API ва база | NestJS · TypeORM · PostgreSQL |
| `Front` | Сомонаи вебӣ | React · Vite · Tailwind · i18next |
| `Mobile` | Барномаи мобилӣ | React Native · Expo |

## Оғоз кардан

### 1. Талабот
- Node.js 18+
- PostgreSQL 14+

### 2. Backend

```bash
cd Back/nest-backend
npm install
cp .env.example .env      # қиматҳои худро гузоред
npm run seed -- --all     # базаро пур мекунад
npm run start:dev         # http://localhost:3005
```

### 3. Frontend

```bash
cd Front
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

## Скриптҳои муфид

| Фармон | Кор |
|---|---|
| `npm run seed -- --all` | Базаро аз сифр пур мекунад |
| `npm run seed:verify` | Маълумотро бе база тафтиш мекунад |

## Деплой (CI/CD)

Ҳар push ба `main` худкор ба продакшн мебарояд — **https://ikhtisosiman.qobus.tj**

| Файл | Кор |
|---|---|
| `.github/workflows/ci.yml` | PR ва бранчҳои дигар: build-и backend ва frontend месанҷад |
| `.github/workflows/deploy.yml` | Push ба `main`: build + деплой ба сервер |
| `scripts/deploy-server.sh` | Дар сервер иҷро мешавад: pull, build, restart, health-check |
| `scripts/autodeploy.sh` | Дар сервер ҳар дақиқа GitHub-ро месанҷад ва деплой мекунад |
| `scripts/install-autodeploy.sh` | Timer-и болоро як маротиба насб мекунад |

Ду роҳи деплой ҳаст ва ҳарду ҳамзамон кор карда метавонанд:

**1. GitHub Actions** (фаврӣ, логҳо дар GitHub)

1. GitHub runner frontend-ро build мекунад (сервер танҳо 2 GB RAM дорад).
2. Тавассути SSH `scripts/deploy-server.sh` дар сервер иҷро мешавад: `git reset --hard <sha>`,
   `npm ci`, `npm run build`, `systemctl restart mycareer-api`.
3. Health-check `/api/clusters`. **Агар API боло наояд, худкор ба коммити пешина бармегардад.**
4. `Front/dist/` ба `/var/www/ikhtisosiman` rsync мешавад.
5. Smoke-test-и сайти зинда.

Агар secret-и `SSH_PRIVATE_KEY` гузошта нашуда бошад, workflow бо огоҳӣ мегузарад (хато намедиҳад)
ва деплойро ба timer вомегузорад.

**2. Timer-и сервер** (эҳтиётӣ, ҳеҷ танзимот дар GitHub лозим нест)

`mycareer-autodeploy.timer` ҳар дақиқа `git fetch` мекунад; агар `origin/main` ҳаракат карда бошад,
ҳамон `deploy-server.sh`-ро бо `--with-frontend` иҷро мекунад.

Ду роҳ бо ҳам муноқиша намекунанд: кадоме аввал деплой кунад, `HEAD` ба `origin/main` баробар
мешавад ва дигаре кор намеёбад. `flock` низ ҳаст, то ду деплой ҳамзамон нашаванд.

```bash
journalctl -u mycareer-autodeploy -f            # тамошои деплойҳо
systemctl disable --now mycareer-autodeploy.timer  # хомӯш кардан
```

### Танзимот дар GitHub

**Settings → Secrets and variables → Actions**

| Навъ | Ном | Қимат |
|---|---|---|
| Secret | `SSH_PRIVATE_KEY` | калиди хусусии деплой (`~/.ssh/mycareer_deploy`) |
| Variable | `VITE_API_URL` | ихтиёрӣ, стандартан `/api` |
| Variable | `VITE_GOOGLE_CLIENT_ID` | ихтиёрӣ, барои Google sign-in |

### Деплойи дастӣ

```bash
# аз сервер
bash /root/My-career/scripts/deploy-server.sh origin/main --with-frontend
```

Ё дар GitHub: **Actions → Deploy to production → Run workflow**.

## Маълумот аз куҷост

Файли `Back/nest-backend/ntc_raw_data.json` рӯйхати хоми МНТ аст.
`src/seed/parse-ntc.ts` онро таҳлил мекунад: кластерҳо, донишгоҳҳо, ихтисосҳо ва
пешниҳодҳоро ҷудо месозад ва қиматҳои вайроншударо ислоҳ мекунад.

Матни ҳар ихтисос аз ду манбаъ меояд:
- `src/seed/content/clusterN-NN.ts` — матни дастнавис барои ихтисосҳои серталаб
- `src/seed/content/families.ts` — 77 оилаи касбӣ, ки боқимондаро бо маълумоти
  мушаххаси соҳа пур мекунанд (технологияҳо, ҷойҳои кор, маош, маслиҳат)

## Муҳит

Ҳарду `.env` дар `.gitignore` ҳастанд. Намунаҳо: `.env.example` дар `Back/nest-backend`
ва `Front`.
