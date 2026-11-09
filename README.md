# 🎯 JobTrackr: AI-Powered Job Application Command Center

An intelligent full-stack job tracking platform that combines a drag-and-drop Kanban board with AI-driven resume analysis. Paste a job URL, and the system scrapes the posting, extracts structured data via LLM, calculates how well your resume fits, identifies missing skills, and generates actionable improvement suggestions — all in one click.

<p align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter_AI-6366F1?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

---

## 🧠 Why JobTrackr Exists

The modern job search is chaos. Applicants juggle dozens of applications across LinkedIn, Indeed, Wellfound, and company portals — losing track of where they applied, what skills each role demanded, and which resume version they sent.

Existing tools like spreadsheets and Trello boards are passive. They store data. **JobTrackr is active**. It:

- **Reads job descriptions for you** — paste a URL or raw text and AI extracts every key detail
- **Compares your resume against the JD** — generating a quantified Match Score, surfacing the exact skills you're missing, and writing actionable suggestions to improve your resume
- **Visualizes your entire funnel** — from Applied → Phone Screen → Interview → Offer, with interactive analytics charts
- **Keeps you accountable** — with follow-up date reminders and a per-application activity timeline

The result is a system that doesn't just track where you applied — it actively helps you **get hired**.

---

## 🚀 Core Features

### 🤖 AI-Powered Job Extraction
Paste any job posting URL or raw description text. The system fetches the page (directly, then through the free [Jina Reader](https://jina.ai/reader/) for sites that block scripts or render with JavaScript), feeds the content to an LLM, and returns structured data: company, role, location, salary, required skills, and nice-to-have skills — auto-filled into a single-click submission form.

### 📊 Resume Fit Analyzer
Upload your "Master Resume" once in your Profile. Every time you extract a new job, the AI runs a zero-shot comparison and returns:
- **Match Score (0-100)** — how well your resume aligns with this specific role
- **Missing Skills** — the exact keywords and technologies absent from your resume
- **Actionable Suggestions** — specific, tailored advice to strengthen your application

### 📋 Drag-and-Drop Kanban Board
A 5-column pipeline (`Applied → Phone Screen → Interview → Offer → Rejected`) powered by [`@dnd-kit`](https://dndkit.com/). Drag cards across columns with:
- **Optimistic UI updates** — instant visual feedback before the server confirms
- **Mathematical order gaps** — position values use 1024-interval spacing to minimize reorder conflicts
- **Batch reordering** — multiple card moves are committed via a single `bulkWrite` Mongoose operation

### 📈 Analytics Dashboard
A dedicated `/dashboard` page built with [Recharts](https://recharts.org/) featuring:
- **Application Funnel** — bar chart tracking drop-off from Applied to Offer
- **Match Score Distribution** — donut chart segmenting your scores into High/Medium/Low
- **Activity Timeline** — line chart of applications submitted over the last 28 days
- **Top Missing Skills** — horizontal bar chart aggregating your most commonly missing skills across all jobs. This tells you exactly what to learn next.

### 🔍 Search & Filter
A real-time search bar filters applications by company name or role. A match score filter dropdown lets you drill into High (80%+), Medium (60-79%), or Low (<60%) match categories.

### 📝 Activity Timeline
Each application has its own timestamped activity log. Record interview notes, track emails sent, log coding challenge completions. The timeline renders as a vertical thread with connected dots inside the Application Modal.

### ⏰ Follow-Up Reminders
Set a follow-up date when creating an application. The Kanban card displays a contextual badge:
- 🟢 **Gray** — follow-up is more than 2 days away
- 🟡 **Amber** — follow-up is within 48 hours
- 🔴 **Red** — follow-up date has passed (you need to act!)

### 📥 CSV Export
One-click client-side export generates a CSV file with columns: Company, Role, Status, Date Applied, Match Score, Location, and Follow-up Date. No server round-trip required.

### ✨ Premium Dark UI
Glassmorphism design language with backdrop-blur panels, indigo accent gradients, ambient background orbs, skeleton loading states, and micro-animations. Built with a custom CSS design system using Inter typography from Google Fonts.

---

## ⚙️ Why OpenRouter Instead of Direct OpenAI?

> OpenAI aggressively rate-limits free-tier and new API keys, frequently returning `429 Too Many Requests` even for modest usage patterns during development.

**The JobTrackr Solution:** Instead of coupling directly to OpenAI's API, the backend routes all LLM calls through [**OpenRouter**](https://openrouter.ai/) — a unified gateway that provides access to GPT-4o-mini, Claude, Llama, and dozens of other models through a single API key. This provides:

- **Zero quota headaches** — OpenRouter's generous free tier never blocked development
- **Free by default** — parsing walks a chain of free OpenRouter models (strongest first) and moves on when one is busy, out of quota or answers with unusable JSON, so it works on an account with no credits. Set `OPENROUTER_MODEL` (e.g. `openai/gpt-4o-mini`) to try a paid model first, or `OPENROUTER_FREE_MODELS` to replace the chain
- **Model portability** — switch models by changing one string
- **Cost transparency** — OpenRouter shows exact per-request costs across all models
- **Identical SDK compatibility** — OpenRouter mirrors the OpenAI SDK interface, so the codebase uses the standard `openai` npm package with just a `baseURL` override

---

## 🏗️ System Architecture

```
User Action (Paste URL or Text)
       ↓
React Frontend (Vite + React 19)
  ├── React Hook Form + Zod (validation)
  ├── @tanstack/react-query (cache + optimistic updates)
  └── @dnd-kit (drag-and-drop engine)
       ↓
Express.js REST API
  ├── JWT Authentication (bcryptjs hashing)
  ├── Zod Request Validation
  └── Centralized Error Handler
       ↓
AI Parsing Pipeline
  ├── Direct fetch, then Jina Reader (JavaScript-rendered and bot-protected pages)
  ├── Cheerio (HTML → clean plaintext)
  └── OpenRouter → free-model chain (structured extraction)
       ↓
MongoDB Atlas (Mongoose ODM)
  ├── Users (hashed passwords, resume text)
  └── Applications (compound index: userId + status)
```

---

## 📂 Project Structure

```
jobtrackr/
├── frontend/                          # React 19 + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   ├── kanban/
│       │   │   ├── KanbanBoard.tsx     # Board orchestrator + DnD + Search/Filter
│       │   │   ├── KanbanColumn.tsx    # Droppable column with empty states
│       │   │   ├── KanbanCard.tsx      # Draggable card with match badges
│       │   │   ├── AddApplicationModal.tsx  # AI-powered add form
│       │   │   └── ApplicationModal.tsx    # Detail view + Activity Timeline
│       │   ├── layout/
│       │   │   └── ProtectedRoute.tsx  # JWT guard
│       │   └── ui/                    # Reusable Button, Input, Modal
│       ├── hooks/
│       │   └── useApplications.ts     # React Query mutations & queries
│       ├── pages/
│       │   ├── DashboardPage.tsx       # Recharts analytics
│       │   ├── ProfilePage.tsx         # Master resume management
│       │   ├── LoginPage.tsx
│       │   └── RegisterPage.tsx
│       ├── context/
│       │   └── AuthContext.tsx         # Global auth state
│       └── types/
│           └── index.ts               # Shared TypeScript interfaces
│
├── server/                            # Node.js + Express + TypeScript
│   └── src/
│       ├── config/
│       │   ├── db.ts                  # MongoDB Atlas connection
│       │   └── env.ts                 # Zod-validated environment config
│       ├── controllers/
│       │   ├── auth.controller.ts     # Register, login, profile
│       │   ├── application.controller.ts  # Full CRUD + batch reorder + activities
│       │   └── ai.controller.ts       # JD parsing orchestrator
│       ├── middleware/
│       │   ├── auth.middleware.ts      # JWT verification
│       │   ├── errorHandler.ts        # Centralized error mapper
│       │   └── validate.ts            # Zod middleware wrapper
│       ├── models/
│       │   ├── User.ts                # User schema with bcrypt hooks
│       │   └── Application.ts         # Application schema (15+ fields)
│       ├── services/
│       │   └── ai.service.ts          # page fetch + OpenRouter integration
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── application.routes.ts
│       │   └── ai.routes.ts
│       └── utils/
│           ├── apiError.ts            # Custom error classes
│           └── asyncHandler.ts        # Express async wrapper
│
├── docs/                              # Phase-by-phase build documentation
│   ├── PHASE-1.md                     # Auth & Foundation
│   ├── PHASE-2.md                     # Kanban Board & DnD
│   ├── PHASE-3.md                     # AI Job Parsing
│   └── PHASE-4.md                     # Resume Matching & Dashboard
│
└── README.md
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint            | Description                | Auth |
|:-------|:--------------------|:---------------------------|:-----|
| `POST` | `/api/auth/register`| Create new user account    | No   |
| `POST` | `/api/auth/login`   | Authenticate & receive JWT | No   |
| `GET`  | `/api/auth/me`      | Fetch current user profile | JWT  |
| `PUT`  | `/api/auth/profile` | Update name & resume text  | JWT  |

### Applications
| Method   | Endpoint                          | Description                          | Auth |
|:---------|:----------------------------------|:-------------------------------------|:-----|
| `GET`    | `/api/applications`               | List all user applications           | JWT  |
| `POST`   | `/api/applications`               | Create new application               | JWT  |
| `PUT`    | `/api/applications/:id`           | Update application fields            | JWT  |
| `DELETE` | `/api/applications/:id`           | Delete an application                | JWT  |
| `PATCH`  | `/api/applications/:id/status`    | Update status & order (drag-drop)    | JWT  |
| `PATCH`  | `/api/applications/reorder`       | Batch reorder within a column        | JWT  |
| `POST`   | `/api/applications/:id/activities`| Add activity to timeline             | JWT  |

### AI
| Method | Endpoint            | Description                                     | Auth |
|:-------|:--------------------|:------------------------------------------------|:-----|
| `POST` | `/api/ai/parse-jd`  | Extract JD via URL/text + resume match analysis | JWT  |

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** 18+
- **npm** 9+
- **MongoDB Atlas** account (free tier works)
- **API key**: [OpenRouter](https://openrouter.ai/) (free models work without credits)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/jobtrackr.git
cd jobtrackr

# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Fill in your `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/jobtrackr
JWT_SECRET=your-strong-random-secret
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📖 Phase-by-Phase Development

This project was built systematically across 4 phases to ensure architectural integrity:

| Phase | Focus | Key Deliverables |
|:------|:------|:-----------------|
| **Phase 1** | Foundation & Auth | Express + MongoDB + JWT + Zod + Glassmorphism design system |
| **Phase 2** | Kanban Board | `@dnd-kit` drag-and-drop + optimistic updates + `bulkWrite` reordering |
| **Phase 3** | AI Job Parsing | OpenRouter integration + Cheerio scraper + structured JSON extraction |
| **Phase 4** | Resume Matching & Analytics | Match Score engine + Missing Skills + Recharts dashboard + Activity Timeline |

Detailed per-phase documentation is available in the [`docs/`](./docs) directory.

---

## 💡 Key Technical Decisions

| Decision | Rationale |
|:---------|:----------|
| **OpenRouter over direct OpenAI** | OpenAI's rate limiting blocked development. OpenRouter provides identical SDK compatibility with zero quota issues and multi-model access. |
| **Direct fetch, then Jina Reader** | Plain `axios` requests to JavaScript-rendered or bot-protected job pages return little or nothing. The free Jina Reader loads the page in a real browser and returns text, with no key. Scrapingdog was used until its free plan ran out (every URL answered 403). |
| **`@dnd-kit` over `react-beautiful-dnd`** | `react-beautiful-dnd` is unmaintained. `@dnd-kit` is actively developed, accessible, lightweight, and supports both pointer and keyboard sensors. |
| **Optimistic updates with rollback** | Drag-and-drop must feel instant. We update React Query cache immediately, then roll back on server error. |
| **Zod on both client and server** | Ensures a single validation contract between frontend forms and backend controllers. Any schema change automatically propagates. |
| **Mathematical order gaps (1024-spacing)** | Avoiding full reindexing on every drag. Items are placed midway between neighbors. Only degrades after ~10 consecutive insertions. |
| **`react-hook-form` + Zod resolver** | Zero re-renders during typing. AI-extracted fields are injected via `setValue()` after LLM response. |

---

## 🔮 Future Roadmap

- **Real-time Collaboration** — WebSocket-based board sharing for team job hunts
- **Chrome Extension** — One-click extraction from any job posting page
- **Email Integration** — Auto-detect interview invites and move cards to "Interview" automatically
- **Resume PDF Generation** — Tailored resume builder using AI suggestions per job
- **Mobile PWA** — Installable progressive web app for on-the-go tracking

---

## 📜 License

This project is released under the [MIT License](./LICENSE).
