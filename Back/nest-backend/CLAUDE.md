# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Type:** Nest.js Backend API (TypeScript, Express-based)
**Purpose:** Career guidance and assessment platform with AI-powered recommendations
**Main Port:** 3005 (configurable via `.env`)
**Database:** PostgreSQL with TypeORM ORM
**Architecture:** Modular monolith with feature-based modules

## Key Technologies

- **Framework:** Nest.js v11
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL with TypeORM
- **Authentication:** Passport local + JWT strategy (7-day expiry)
- **API Documentation:** Swagger/OpenAPI at `/api/docs`
- **Caching:** Cache-manager (in-memory, 60s TTL, max 100 items)
- **AI Integrations:** Google Gemini AI, Groq SDK
- **Validation:** class-validator with class-transformer
- **Testing:** Jest

## Project Structure

```
src/
├── main.ts              # Application bootstrap, CORS, global pipes, Swagger setup
├── app.module.ts        # Root module with all imports and DB configuration
│
├── auth/                # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   ├── guards/
│   ├── decorators/
│   └── dto/
│
├── users/               # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── user.entity.ts   # User with quiz results, chat history, saved/liked careers
│   └── dto/
│
├── career/              # Career management (CRUD + rich career data)
│   ├── career.controller.ts
│   ├── career.service.ts
│   ├── career.entity.ts # Extensive career data: skills, roadmap, resources, salaries, etc.
│   └── dto/
│
├── cluster/             # Career clusters/categories
│   ├── cluster.controller.ts
│   ├── cluster.service.ts
│   ├── cluster.entity.ts
│   └── dto/
│
├── quiz/                # Psychological assessment (RIASEC model)
│   ├── quiz.controller.ts
│   ├── quiz.service.ts  # Calculates scores, matches to careers
│   ├── data/            # Quiz questions data
│   └── dto/
│
└── ai/                  # AI chat and recommendations
    ├── ai.service.ts   # Gemini/Groq integration with daily usage limits
    └── ai.module.ts
```

## Database Entities & Relationships

**Core Entities:**
- `User`: Stores user profile, quiz results (RIASEC + cognitive + motivation), chat history, AI daily usage tracking, and many-to-many relationships with careers (saved/liked)
- `Career`: Comprehensive career information including skills, roadmap, learning resources, salaries, psychological profile (RIASEC scores), and relations to Cluster
- `Cluster`: Categories/groups of careers with RIASEC primary type
- **Join Tables:** `user_saved_careers`, `user_liked_careers` (auto-created by TypeORM)

**Key Relationships:**
- Career ↔ Cluster (ManyToOne)
- Career ↔ User (ManyToMany for saved/liked)
- User stores quiz results as JSONB

## Common Development Commands

**From `nest-backend/package.json`:**

```bash
# Development
npm run start:dev              # Start with hot-reload
npm run start:debug            # Start with debugger (--inspect)

# Build & Production
npm run build                  # Build to dist/ (clears previous output)
npm run start:prod             # Run compiled production app

# Code Quality
npm run lint                   # Run ESLint with auto-fix
npm run format                 # Format with Prettier

# Testing
npm test                       # Run all Jest tests once
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Generate coverage report
npm run test:debug             # Debug tests with inspector
npm run test:e2e               # Run E2E tests (requires ./test/jest-e2e.json)
```

**Database:**
- TypeORM auto-sync is enabled in non-production (from `AppModule`)
- Production: Run migrations manually (not configured yet)
- `.env` file required with DB credentials (see below)

## Environment Configuration

**Required in `.env`** (example provided in repo):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<your_password>
DB_NAME=career_db
PORT=3005
JWT_SECRET=<strong_secret_key>
CORS_ORIGIN=http://localhost:5173,http://localhost:3000  # Optional, defaults to frontend URLs
GEMINI_API_KEY=  # Optional: AI chat feature
GROQ_API_KEY=     # Optional: AI chat feature
```

**Runtime:**
- App reads from `.env` via `@nestjs/config` (loaded at `AppModule`)
- Global CORS configured for frontend origins
- Swagger UI at `http://localhost:3005/api/docs` (protected with Bearer token for auth endpoints)

## API Information

**Global Prefix:** All routes prefixed with `/api`
- Example: `/api/careers`, `/api/auth/login`, `/api/quiz/questions`

**Authentication:**
- JWT-based via `@nestjs/passport` with `jwt` strategy
- Pass tokens in `Authorization: Bearer <token>` header
- Admin role required for career creation/modification (`@Roles('admin')`)

**Key Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/careers` - List careers with filters/pagination (`GetCareersDto`)
- `GET /api/careers/:id` - Get single career
- `POST /api/quiz/questions` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz, get top 12 career matches
- `POST /api/quiz/submit-authenticated` - Same + saves results to user
- `POST /api/ai/chat` - AI chat (authenticated, with rate limiting per user)

**Swagger Docs:** `GET /api/docs` - Interactive API browser (use "Authorize" button with JWT)

## Important Patterns & Conventions

**Module Structure:** Each feature follows Nest.js pattern:
- `*.controller.ts` - Route handlers, request/response mapping
- `*.service.ts` - Business logic, data access
- `*.entity.ts` - TypeORM database entities (in same module)
- `dto/` - Data transfer objects with class-validator decorators

**DTO Validation:** Uses `class-validator` decorators. ValidationPipe globally enabled with `whitelist: true` (strips unknown properties).

**Authorization:**
- Custom `@Roles()` decorator + `RolesGuard` for role-based access
- `@UseGuards(AuthGuard('jwt'))` for protected routes
- User role enum: `UserRole.USER` | `UserRole.ADMIN`

**Error Messages:** Mixed languages - primarily Tajik/Russian for user-facing messages, English for logs

**API Responses:** Generally direct return of data objects (no explicit wrapper). Errors throw Nest built-in exceptions (`NotFoundException`, `UnauthorizedException`, etc.)

**Caching:** `CacheModule` globally registered (60s TTL, 100 max). Services can inject `Cache` service.

## Known Considerations

**Security:**
- `.env` contains hardcoded credentials - DO NOT commit real production secrets
- `synchronize: true` in non-production only - disable before production
- JWT secret should be strong and stored securely

**Data Model:**
- User quiz results stored as JSONB (not normalized) - intentional for flexibility
- AI usage tracking per user with date-based reset pattern
- Career psychological profile uses RIASEC 6-factor model (realistic, investigative, artistic, social, enterprising, conventional)

**AI Services:**
- Two providers: Google Gemini (`@google/generative-ai`) and Groq (`groq-sdk`)
- Daily usage limit tracked in `user.aiDailyUsage` (reset strategy by date comparison)

## TypeScript Configuration

**⚠️ Do NOT add `"ignoreDeprecations": "6.0"`.**
This project runs TypeScript 5.9. That value is only accepted by TypeScript 6.x, so
adding it makes every build fail with:

```
tsconfig.json:3:31 - error TS5103: Invalid value for '--ignoreDeprecations'.
```

On TS 5.x the only accepted value is `"5.0"`, and it is only needed when the config
actually uses a deprecated option (`importsNotUsedAsValues`, `preserveValueImports`,
`keyofStringsOnly`, `out`, …). This `tsconfig.json` uses none of them, so the option
should simply be absent — which is how it is set up now.

**Deprecation notes for a future TypeScript upgrade:**
- `baseUrl: "./"` is deprecated and will stop functioning in TS 7.0 — replace it with
  explicit `paths` mappings when upgrading.
- `rootDir` is set to `"./"`; Nest expects it to match the common source directory.

## Testing

**Framework:** Jest (configured in package.json scripts)
**Unit tests:** Standard Nest.js testing patterns with `Test.createTestingModule`
**E2E tests:** Separate config at `./test/jest-e2e.json` (if created)

To run specific test file:
```bash
npm test -- path/to/testfile.spec.ts
```

To run by test name pattern:
```bash
npm test -- -t "test name pattern"
```

## Development Workflow

1. Make changes in `src/` modules
2. `npm run start:dev` for hot-reload during development
3. `npm run lint` before committing to catch issues
4. Update Swagger docs with `@ApiOperation`, `@ApiParam`, etc. decorators
5. Database schema changes: Update `*.entity.ts` - TypeORM auto-sync in dev

## Database Migrations

Currently using `synchronize: true` in development (auto-updates schema). For production:
- Generate migration: `nest exec typeorm migration:generate -n MigrationName`
- Run migration: `nest exec typeorm migration:run`

Recommend adding proper migration workflow before production deployment.

## Additional Notes

- Frontend likely exists in separate directory (`../A Front My career` based on CORS origins)
- All dates/times stored as UTC in PostgreSQL
- Swagger UI includes Bearer auth setup - click "Authorize" and enter `Bearer <token>`
- Debug port: 9229 when using `npm run start:debug`
