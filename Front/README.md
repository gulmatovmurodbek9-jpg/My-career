<p align="center">
  <img src="./src/assets/logop.png" alt="My Career Logo" width="120" />
</p>

<h1 align="center">🎯 My Career — Касби Ман</h1>

<p align="center">
  <strong>AI-Powered Career Guidance Platform for the Youth of Tajikistan</strong>
</p>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Setup</a> •
  <a href="#api-reference">API</a> •
  <a href="#future-plans">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%2B%20Groq-8E75B2?style=flat-square&logo=google" alt="AI" />
  <img src="https://img.shields.io/badge/i18n-TJ%20%7C%20RU%20%7C%20EN-green?style=flat-square" alt="Languages" />
</p>

---

## 📖 Project Overview

**My Career (Касби Ман)** is a comprehensive, AI-driven web platform designed to help young people in Tajikistan discover their ideal career path. The platform combines **psychological profiling** through the internationally recognized RIASEC model, **artificial intelligence** for personalized advice, and a **curated database of 150+ professions** organized into career clusters.

### The Problem

In Tajikistan, youth face a significant gap in professional career guidance. Many students choose their professions without understanding their own aptitudes, the labor market demand, or the educational pathways required. This leads to career dissatisfaction, high dropout rates, and underemployment.

### Our Solution

My Career bridges this gap by providing:

- **Scientific self-assessment** — A psychological quiz based on the Holland (RIASEC) model that evaluates six personality dimensions: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.
- **AI-powered personalization** — Individualized career reports, interactive career chat, and multi-career comparison tools powered by state-of-the-art LLMs (Google Gemini & Groq/Llama).
- **Localized content** — All content and AI responses are available in **Tajik (тоҷикӣ)**, **Russian (русский)**, and **English**, making the platform accessible to the widest possible audience.

### Target Audience

| Audience | Benefit |
|---|---|
| 🎓 **High school students (14–18)** | Discover careers that match their personality before choosing a university |
| 🎒 **University students (18–25)** | Validate their major choice or explore career pivots |
| 👨‍👩‍👧 **Parents & guardians** | Access data-driven insights to support their children's decisions |
| 🏫 **Educators & counselors** | Use the platform as a supplementary guidance tool |

---

## ✨ Key Features

### 🧠 Psychological Assessment (RIASEC Quiz)
A multi-phase, interactive quiz that evaluates the user across the six Holland personality types. The quiz includes:
- **30+ calibrated questions** spanning real-world scenarios
- **Cognitive metrics** — logical thinking, creativity, problem-solving, and emotional intelligence
- **Visual results** — Radar charts and bar graphs visualize the user's RIASEC profile
- **Cluster mapping** — Automatically maps results to the most compatible career clusters

### 🤖 AI Career Advisor
An intelligent advisor that generates personalized, structured career reports:
- **Personality analysis** — Detailed interpretation of RIASEC results
- **Career roadmap** — Step-by-step educational and career paths for top-matched professions
- **Strengths & growth areas** — Actionable advice tailored to the user's profile
- **Multi-language output** — Reports generated in the user's preferred language

### 💬 AI Career Chat
A real-time conversational interface where users can:
- Ask specific questions about any career (salary, demand, required skills)
- Get localized answers relevant to the Tajik labor market
- Receive contextual advice based on their quiz results and liked/saved careers
- Daily usage limits ensure responsible AI consumption (5 questions/day)

### ⚖️ Career Comparison Tool
Select **2–5 careers** and get a comprehensive AI-generated comparison:
- Pros and cons for each career relative to the user's personality
- Market demand and salary ranges
- Learning difficulty assessment
- A clear **best match** recommendation with justification

### 📊 Personalized Dashboard
A centralized hub for each user featuring:
- **Saved/liked careers** collection
- **RIASEC profile visualization** (interactive charts)
- Quick access to AI Advisor reports, Chat, and Career Comparison
- Career match percentages based on quiz results

### 🔍 Career Discovery
Browse and search the full career database:
- Organized into **career clusters** (Technology, Economics, Arts, Medicine, etc.)
- Each career displays: description, required skills, salary data, educational path
- Filter by cluster, search by name
- Like/save careers for later reference

### 🛡️ Admin Panel
A protected administrative interface for:
- CRUD operations on careers and clusters
- Platform analytics and statistics
- User management
- Bulk operations (recalculate likes, delete all, etc.)

### 🌐 Full Internationalization (i18n)
- **3 languages**: Tajik 🇹🇯, Russian 🇷🇺, English 🇬🇧
- Dynamic language switching across all UI components and AI-generated content
- SEO-friendly meta tags in all languages

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **Vite** | Lightning-fast build tool and dev server |
| **Tailwind CSS 4** | Utility-first CSS framework for rapid styling |
| **Framer Motion** | Physics-based animations and page transitions |
| **React Router 7** | Client-side routing with protected routes |
| **Zustand** | Lightweight state management for auth & user data |
| **Axios** | HTTP client for REST API communication |
| **Recharts** | Data visualization (radar charts, bar charts) |
| **React Three Fiber** | 3D WebGL elements on the landing page |
| **i18next** | Internationalization framework |
| **Lucide React** | Modern icon library |

### Backend

| Technology | Purpose |
|---|---|
| **NestJS 11** | Enterprise-grade Node.js framework |
| **TypeORM** | ORM for PostgreSQL database interactions |
| **PostgreSQL** | Relational database for persistent storage |
| **Passport + JWT** | Authentication with JSON Web Tokens |
| **Swagger (OpenAPI)** | Auto-generated API documentation |
| **Google Generative AI SDK** | Integration with Gemini 2.0 Flash |
| **Groq SDK** | Integration with Llama 3.3-70B (primary AI) |
| **class-validator** | Request DTO validation |
| **bcrypt** | Secure password hashing |

### AI & Intelligence Layer

| Model | Role |
|---|---|
| **Groq — Llama 3.3 70B** | Primary AI provider (fast inference) |
| **Google Gemini 2.0 Flash** | Fallback AI provider (high availability) |

The system uses a **dual-provider failover architecture**: if Groq returns a rate-limit error or fails, the request is transparently retried with Google Gemini, ensuring **near-zero downtime** for AI-powered features.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                          │
│  React 19 + Vite + Tailwind + Framer Motion              │
│  ┌──────────┬──────────┬──────────┬─────────────────┐    │
│  │   Home   │   Quiz   │Dashboard │    Admin Panel   │    │
│  │  (3D/GL) │ (RIASEC) │(AI Tools)│   (CRUD Mgmt)   │    │
│  └──────────┴──────────┴──────────┴─────────────────┘    │
│         │           │          │            │             │
│         └───────────┴──────────┴────────────┘             │
│                         │ Axios                           │
│                         ▼                                 │
└─────────────────── REST API ──────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVER (NestJS API)                      │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────────────┐   │
│  │   Auth   │  Career  │   Quiz   │    AI Service    │   │
│  │ Module   │  Module  │  Module  │     Module       │   │
│  │(JWT/Pass)│(CRUD/Lk) │(Score/   │(Groq ↔ Gemini)  │   │
│  │          │          │ Match)   │                  │   │
│  └───┬──────┴───┬──────┴───┬──────┴──────┬───────────┘   │
│      │          │          │             │                │
│      ▼          ▼          ▼             ▼                │
│  ┌──────────────────────────┐   ┌────────────────────┐   │
│  │    PostgreSQL (TypeORM)  │   │   AI Providers     │   │
│  │                          │   │  ┌──────────────┐  │   │
│  │  Users | Careers         │   │  │   Groq API   │  │   │
│  │  Clusters | Quiz Results │   │  │ (Llama 3.3)  │  │   │
│  │                          │   │  └──────┬───────┘  │   │
│  └──────────────────────────┘   │         │ fallback │   │
│                                  │  ┌──────▼───────┐  │   │
│                                  │  │ Gemini API   │  │   │
│                                  │  │ (Flash 2.0)  │  │   │
│                                  │  └──────────────┘  │   │
│                                  └────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User opens the app** → React SPA loads via Vite
2. **Takes the RIASEC Quiz** → Answers are scored client-side; results are stored in `localStorage` and in the user's DB record
3. **Views Career Matches** → Frontend sends scored results to `/api/careers/match` → Backend calculates compatibility percentages
4. **Uses AI Advisor** → Frontend calls `/api/careers/ai-advisor` → Backend composes a detailed prompt from RIASEC scores → Sends to Groq (or Gemini fallback) → Returns structured career report
5. **Chats with AI** → Real-time Q&A via `/api/careers/ask` with daily rate limiting
6. **Compares Careers** → Selected careers + RIASEC profile → `/api/careers/compare` → AI generates structured comparison with a best-match recommendation

---

## 📂 Project Structure

### Frontend (`A Front My career/`)

```
src/
├── App.jsx                  # Root component with routing
├── main.jsx                 # Entry point
├── index.css                # Global styles & Tailwind config
├── components/
│   ├── RouteGuards.jsx      # ProtectedRoute, PublicRoute, AdminRoute
│   ├── three/               # 3D WebGL components (React Three Fiber)
│   └── ui/                  # Reusable UI primitives
├── lib/
│   ├── config.js            # API base URL configuration
│   └── i18n.js              # i18next initialization & translations
├── store/
│   └── authStore.js         # Zustand store (auth, user, tokens)
└── pages/
    ├── home/                # Landing page with 3D hero, stats, features
    ├── about/               # About — mission, team, timeline, values
    ├── auth/                # Login & Registration forms
    ├── careers/             # Career browsing, search, cluster filtering
    ├── quiz/                # RIASEC psychological assessment
    ├── dashboard/           # User dashboard
    │   ├── Dashboard.jsx    # Main dashboard hub
    │   ├── AiChat.jsx       # AI career chat interface
    │   ├── CareerAdvisorReport.jsx  # AI-generated career report
    │   └── CareerCompare.jsx        # AI career comparison tool
    ├── favorites/           # Saved/liked careers collection
    ├── info/                # Career detail views
    ├── admin/               # Admin panel (CRUD, analytics)
    └── layout/              # Shared layout components (navbar, footer)
```

### Backend (`A Back My career/nest-backend/`)

```
src/
├── main.ts                  # Application bootstrap & Swagger setup
├── app.module.ts            # Root module — imports all feature modules
├── auth/
│   ├── auth.module.ts       # Authentication module
│   ├── auth.controller.ts   # POST /login, /signin, /register
│   ├── auth.service.ts      # JWT token generation, password validation
│   ├── strategies/          # Passport JWT strategy
│   ├── guards/              # RolesGuard for admin protection
│   └── decorators/          # @Roles() custom decorator
├── users/
│   ├── users.module.ts      # User management module
│   ├── users.service.ts     # User CRUD & quiz result storage
│   ├── user.entity.ts       # User entity (email, password, role, quizResults, chatHistory)
│   └── dto/                 # CreateUserDto, UpdateUserDto
├── career/
│   ├── career.module.ts     # Career management module
│   ├── career.controller.ts # Full REST API + AI endpoints
│   ├── career.service.ts    # Business logic, matching, AI orchestration
│   ├── career.entity.ts     # Career entity (name, skills, salary, psychProfile)
│   └── dto/                 # CreateCareerDto, UpdateCareerDto, GetCareersDto
├── cluster/
│   ├── cluster.module.ts    # Career cluster module
│   ├── cluster.controller.ts# Cluster CRUD endpoints
│   ├── cluster.service.ts   # Cluster business logic
│   └── cluster.entity.ts    # Cluster entity (name, icon, riasecPrimary)
├── quiz/
│   ├── quiz.module.ts       # Quiz processing module
│   ├── quiz.controller.ts   # Quiz submission & result endpoints
│   └── quiz.service.ts      # RIASEC scoring, career matching, AI prompt generation
└── ai/
    ├── ai.module.ts         # AI integration module
    └── ai.service.ts        # Dual-provider AI service (Groq + Gemini fallback)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** or **yarn**

### 1. Clone the Repositories

```bash
git clone <frontend-repo-url> "A Front My career"
git clone <backend-repo-url> "A Back My career"
```

### 2. Setup the Backend

```bash
cd "A Back My career/nest-backend"
npm install
```

Create a `.env` file in `nest-backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my_career
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key

# AI Providers
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# CORS
CORS_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3004/api` and Swagger docs at `http://localhost:3004/api/docs`.

### 3. Setup the Frontend

```bash
cd "A Front My career"
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3004/api
```

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Full interactive documentation is available via **Swagger** at `/api/docs` when the server is running.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user | — |
| `POST` | `/auth/login` | Login and receive JWT | — |
| `POST` | `/auth/signin` | Login (alternative endpoint) | — |

### Careers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/careers` | List all careers (pagination, filtering) | — |
| `GET` | `/careers/:id` | Get career by ID | — |
| `POST` | `/careers` | Create a career | 🔒 Admin |
| `PUT` | `/careers/:id` | Update a career | 🔒 Admin |
| `DELETE` | `/careers/:id` | Delete a career | 🔒 Admin |
| `DELETE` | `/careers` | Delete all careers | 🔒 Admin |
| `POST` | `/careers/:id/like` | Toggle like on a career | 🔒 User |
| `POST` | `/careers/match` | Match careers to RIASEC scores | — |
| `POST` | `/careers/ask` | Ask AI about a career | 🔒 User |
| `POST` | `/careers/ai-advisor` | Generate AI career advisor report | 🔒 User |
| `POST` | `/careers/compare` | Compare multiple careers via AI | 🔒 User |
| `GET` | `/careers/stats` | Platform analytics | 🔒 Admin |

### Clusters

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/clusters` | List all career clusters | — |
| `POST` | `/clusters` | Create a cluster | 🔒 Admin |

### Quiz

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/quiz/submit` | Submit quiz answers for scoring | 🔒 User |
| `GET` | `/quiz/results` | Retrieve user's quiz results | 🔒 User |

---

## 🧪 How It Works — Technical Deep Dive

### RIASEC Scoring Engine

The quiz service processes raw answers through a multi-step pipeline:

1. **Answer Mapping** → Each answer maps to one or more RIASEC dimensions
2. **Weighted Scoring** → Scores are normalized to a 0–100 scale across all six dimensions
3. **Cluster Matching** → Each career cluster has a `riasecPrimary` type; the user's top-scoring dimensions are matched against clusters
4. **Career Ranking** → Individual careers within matched clusters are ranked by a compatibility percentage based on the career's `psychologicalProfile` field

### AI Service — Dual-Provider Failover

```
User Request
     │
     ▼
┌─────────────┐    Success    ┌──────────────────┐
│  Groq API   │──────────────→│  Return Response  │
│ (Llama 3.3) │               └──────────────────┘
└──────┬──────┘
       │ Rate Limit / Error
       ▼
┌─────────────┐    Success    ┌──────────────────┐
│ Gemini API  │──────────────→│  Return Response  │
│(Flash 2.0)  │               └──────────────────┘
└──────┬──────┘
       │ Error
       ▼
┌──────────────────┐
│  Throw Exception │
└──────────────────┘
```

- **Rate Limiting**: Users are limited to **5 AI questions per day** to ensure fair usage
- **Context-Aware Prompts**: The AI receives the user's RIASEC profile, liked careers, and chat history for contextual responses
- **Structured Output**: AI Advisor and Career Compare endpoints return **structured JSON** (not free text), parsed and validated on the backend

### Authentication & Authorization Flow

```
Register/Login → JWT Token → Stored in Zustand + localStorage
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                    ProtectedRoute       AdminRoute
                    (role: user)        (role: admin)
                          │                   │
                    Dashboard/Quiz       Admin Panel
                    AI Features          CRUD Operations
```

---

## 🎯 Goals & Impact

### Social Impact
- **Reduce career mismatch** — Help youth choose professions aligned with their psychological profile
- **Democratize career guidance** — Provide free, AI-powered career counseling to all, regardless of geographic or economic background
- **Bridge the language gap** — Full Tajik-language support ensures accessibility for native speakers

### Educational Impact
- **Integrate with schools** — Teachers and counselors can recommend the platform as a supplementary tool
- **Data-driven decisions** — Replace guesswork with scientifically validated assessments
- **Continuous learning** — The AI chat feature serves as an always-available career information resource

### Technical Impact
- **Showcase AI in education** — Demonstrate how generative AI can be responsibly integrated into educational technology
- **Open architecture** — Modular NestJS backend makes it easy for other developers to contribute or extend

---

## 🔮 Future Plans

| Phase | Feature | Description |
|-------|---------|-------------|
| **v2.0** | 📱 Mobile App | Native iOS & Android app using React Native |
| **v2.0** | 🎤 Voice Interaction | Voice-based career Q&A for accessibility |
| **v2.1** | 🏢 Employer Integration | Partner with local companies to show real job openings |
| **v2.1** | 📈 Analytics Dashboard | Detailed analytics for educators and policymakers |
| **v2.2** | 🧑‍🤝‍🧑 Mentorship Matching | Connect students with professionals in their field of interest |
| **v2.2** | 🎮 Gamification | Badges, progress tracking, and career exploration challenges |
| **v3.0** | 🌍 Regional Expansion | Expand to Uzbekistan, Kyrgyzstan, and other Central Asian countries |
| **v3.0** | 🔬 Research API | Public API for researchers studying career guidance and youth employment |

---

## 👨‍💻 Author

**Gulmatov Murodbek** — Founder & Lead Developer

---

## 📄 License

This project is developed for educational and social impact purposes. All rights reserved.

---

<p align="center">
  <strong>My Career — Касби Ман</strong><br/>
  <em>Empowering Tajik Youth to Build Their Future, One Career at a Time.</em>
</p>
