# Thinking & Approach

> A deep-dive into the engineering decisions, trade-offs, and problem-solving methodology behind JobTrackr.

---

## 1. Problem Statement & Motivation

### The Core Problem
Job seekers applying to 30-100+ positions face three compounding problems:

1. **Information Overload** — Every job posting has a unique mix of required skills, salary bands, seniority expectations, and location constraints. Manually extracting and comparing this data across dozens of applications is unsustainable.

2. **Resume-JD Mismatch Blindness** — Applicants submit the same generic resume everywhere. They don't know *which specific skills* they're missing for *which specific role* until they're rejected.

3. **Pipeline Amnesia** — Without a structured system, applicants forget which companies they applied to, when they need to follow up, and what happened at each stage.

### Why Existing Tools Fall Short

| Tool | Limitation |
|:-----|:-----------|
| **Spreadsheets** | Passive storage. No intelligence. Manual data entry. No visual pipeline. |
| **Trello/Notion** | Generic boards. No job-specific AI. No resume comparison. No scraping. |
| **LinkedIn Job Tracker** | Locked to LinkedIn postings only. No cross-platform view. No resume analysis. |
| **Huntr / Teal** | Paid SaaS with limited free tiers. Closed-source. No self-hosting. |

### The JobTrackr Thesis
> What if the tracker itself could *read* job descriptions, *understand* your resume, and *tell you* exactly what to fix — before you apply?

JobTrackr is designed as an **active intelligence layer** on top of the job search, not a passive spreadsheet replacement.

---

## 2. Architecture Philosophy

### 2.1 Monorepo with Clean Separation

I chose a monorepo structure (`frontend/` + `server/`) rather than a polyrepo or a full monorepo framework (Nx, Turborepo) because:

- **Simplicity over ceremony** — For a 2-person-or-less team, Turborepo adds configuration overhead without meaningful benefit.
- **Shared nothing** — The frontend and backend share zero code at build time (no shared types package). TypeScript interfaces are duplicated intentionally so each side can evolve independently.
- **Single git history** — Easier to trace feature development across the stack during code review or interviews.

### 2.2 Why MERN Over Next.js Full-Stack?

The initial temptation was to use Next.js with API routes or Server Actions. I chose a decoupled Express backend for specific reasons:

| Consideration | Next.js API Routes | Express Backend |
|:--------------|:-------------------|:----------------|
| **WebSocket support** | Awkward, requires custom server | Native with `ws` or `socket.io` |
| **Background jobs** | Not possible without edge functions | Easy with `node-cron` or Bull queues |
| **Independent scaling** | API scales with frontend | API and UI scale independently |
| **Deployment flexibility** | Vercel-centric | Any Node.js host (Railway, Render, EC2) |
| **Interview clarity** | "It's a Next.js app" | "I built a REST API and a React SPA separately — here's why" |

The decoupled architecture also forces proper API design discipline — every feature must work through a documented REST contract, which improves testability and makes the system more portable.

### 2.3 TypeScript Everywhere

Both `frontend/` and `server/` use strict TypeScript (`"strict": true`). This wasn't just a preference — it was a deliberate engineering constraint:

- **Zod schemas mirror TypeScript interfaces** — The `applicationBaseSchema` in the controller uses `z.object()` which directly maps to the `IApplication` Mongoose interface. A field mismatch between frontend form, API payload, and database schema is caught at compile time, not at runtime in production.
- **LLM output contracts** — The `ParsedJobDescription` interface enforces that the AI service always returns typed data. If the LLM hallucinates an unexpected field, `JSON.parse()` + type assertion catches it.

---

## 3. AI Pipeline: Design Thinking

### 3.1 The Scraping Problem

**Challenge:** The user pastes a LinkedIn or Indeed URL. I need to extract the job description text. But major job boards aggressively block automated requests with:
- CAPTCHAs
- JavaScript rendering gates (content loaded via React/Next.js hydration)
- IP-based rate limiting
- Cloudflare bot protection

**Solution — Tiered Scraping Strategy:**

```
User pastes URL
       ↓
Direct axios GET with browser-like User-Agent headers
       ↓
Cheerio: Strip <script>, <style>, <nav>, <footer>, <header>
       ↓
Extract <body> plaintext → Collapse whitespace
       ↓
Length check: text.length >= 500?   (a JavaScript shell has far less text than a job post)
  ├── YES → Pass to LLM
  └── NO  → Jina Reader (r.jina.ai): loads the page in a real browser, returns text
              ├── >= 200 characters and not an error page → Pass to LLM
              └── otherwise → friendly error: "Site is protected. Try pasting text manually."
```

**Why the Jina Reader, and not a paid proxy?** (Updated 2026-11: the design first used Scrapingdog.)
- It renders JavaScript, so Lever, Greenhouse and Ashby postings work
- A single GET to `https://r.jina.ai/<url>`: no SDK, no key, no quota to run out
- Scrapingdog's free plan allowed 1,000 requests, ran out, and then every URL answered 403, which silently broke the URL flow

**The fallback is critical.** If scraping fails, the user can always switch to "Text Mode" and paste the raw JD text. The AI pipeline is URL-agnostic — it only cares about the plaintext input, not how it was obtained.

### 3.2 The LLM Extraction Strategy

**Challenge:** Convert free-form, inconsistently formatted job description text into a strict JSON object matching our Mongoose schema.

**Key Design Decisions:**

#### a) Single Zero-Shot Prompt
I use a single `system` prompt + `user` message rather than multi-turn conversations or chain-of-thought prompting. Why?

- **Latency** — Every additional LLM turn adds 1-3 seconds of latency. A single turn keeps the parse under 5 seconds.
- **Cost** — Multi-turn conversations multiply token usage.
- **Determinism** — With `temperature: 0.1`, a single well-structured prompt produces consistent output. Chain-of-thought adds variance.

#### b) Conditional Resume Comparison
The prompt uses **template literals** to conditionally inject resume analysis instructions:

```typescript
// When user has a saved resume:
${resumeText ? `"matchScore": Number between 0 and 100...` : `"matchScore": null`}
```

This means:
- **No resume saved** → The LLM only extracts JD fields; `matchScore`, `missingSkills`, and `resumeSuggestions` are all `null`/empty.
- **Resume saved** → The LLM receives both documents and performs cross-referencing in a single inference call.

This avoids a separate "analyze resume" API call, saving both latency and cost.

#### c) `response_format: { type: 'json_object' }`
The OpenAI SDK (and OpenRouter's compatible API) supports a JSON mode that guarantees the output is parseable JSON. Without this flag, the LLM occasionally wraps output in markdown code fences (` ```json ... ``` `), which breaks `JSON.parse()`.

#### d) Input Truncation
```typescript
text.substring(0, 15000)  // JD text capped at 15K characters
resumeText.substring(0, 5000)  // Resume capped at 5K characters
```
This prevents token overflow on GPT-4o-mini (128K context window) while keeping costs predictable.

### 3.3 Why OpenRouter Over Direct OpenAI

During development, I hit a significant blocker: **OpenAI aggressively rate-limits new API keys**, returning `429 Too Many Requests` even with modest usage (5-10 requests per minute during testing).

**Evaluation of alternatives:**

| Option | Pros | Cons |
|:-------|:-----|:-----|
| **Direct OpenAI** | Official SDK, best docs | Rate limiting killed development velocity |
| **Anthropic Claude** | Excellent reasoning | Different SDK, different API shape |
| **Google Gemini** | Free tier, fast | Different SDK entirely |
| **Ollama (local)** | No API costs, private | Requires GPU, inconsistent JSON output |
| **OpenRouter** ✅ | Unified SDK (OpenAI-compatible), access to all models, generous free tier | Minor additional latency (~50ms) |

OpenRouter was the clear winner because:
1. **Zero code refactoring** — it mirrors the OpenAI SDK exactly. I only changed `baseURL` and `apiKey`.
2. **Model switching is a string change** — I can swap from `openai/gpt-4o-mini` to `anthropic/claude-3.5-sonnet` or `meta-llama/llama-3.1-70b` without touching any other code.
3. **No more rate-limit issues** — OpenRouter's aggregated capacity never throttled me during development.

---

## 4. Drag-and-Drop Engineering

### 4.1 Why @dnd-kit Over react-beautiful-dnd

`react-beautiful-dnd` (by Atlassian) was the industry standard for years. However:
- It is [officially unmaintained](https://github.com/atlassian/react-beautiful-dnd) — no new releases since 2022.
- It doesn't support React 18+ concurrent features.
- Its API is opinionated and difficult to customize (e.g., custom collision detection is nearly impossible).

`@dnd-kit` provides:
- Active maintenance and React 19 compatibility
- Both `PointerSensor` and `KeyboardSensor` for accessibility
- `closestCorners` collision detection which works well for Kanban column geometry
- A clean separation between `useDroppable` (columns) and `useSortable` (cards)

### 4.2 Optimistic Updates with Rollback

The drag-and-drop interaction **must feel instantaneous**. A naive approach would:
1. User drops card
2. Send API request
3. Wait for response
4. Update UI

This creates a jarring 200-500ms delay where the card "snaps back" then "jumps forward." Unacceptable.

**My approach:**

```
User starts dragging (onDragStart)
       ↓
Store activeId for DragOverlay rendering
       ↓
User hovers over new column (onDragOver)
       ↓
IMMEDIATELY update localApps state (optimistic)
  → Card visually moves to the new column
       ↓
User drops card (onDragEnd)
       ↓
Fire API request (PATCH /applications/:id/status)
  ├── SUCCESS → React Query invalidates and confirmed
  └── FAILURE → React Query rollback (cache restored to pre-drag state)
```

The `onDragOver` handler is the key insight. Most implementations only handle `onDragEnd`. By moving the card in local state during `onDragOver`, the user sees the card in its new column *while still holding it*. This matches the UX of production tools like Jira and Linear.

### 4.3 Mathematical Order Gaps

When dragging cards within a column, I need to determine the card's new `order` value without reindexing every card in the column.

**Strategy: 1024-interval spacing**

```
Initial state:
  Card A: order = 1024
  Card B: order = 2048
  Card C: order = 3072

Insert between A and B:
  New card: order = floor((1024 + 2048) / 2) = 1536

Insert between A and New:
  Another card: order = floor((1024 + 1536) / 2) = 1280
```

This supports ~10 consecutive insertions between the same pair before the gap collapses. When it does collapse, a background `bulkWrite` reindexes the entire column — this is the `batchReorder` endpoint.

**Why not use array indices?** Because array reindexing after every drag requires updating *every* card in the column (N writes). Mathematical gaps require updating only *1 card* for 90%+ of operations.

---

## 5. Data Model Design

### 5.1 Application Schema Decisions

The `Application` model has 15+ fields. Key decisions:

**Compound Index: `{ userId: 1, status: 1 }`**
- The most common query is "get all applications for user X filtered by status Y" (the Kanban board).
- This compound index makes the query a covered index scan — O(log n) instead of O(n).

**`activities` as Embedded Array (Not a Separate Collection)**
- Activities (notes/timeline entries) are always accessed alongside the parent application.
- There's no use case for "get all activities across all applications" — it's always "get activities for THIS application."
- Embedding avoids a `$lookup` join, keeping reads fast.
- MongoDB's 16MB document limit is a non-issue — even 1,000 activity entries would be ~50KB.

**`order` as a Number (Not Array Index)**
- Explained in Section 4.3 above. Enables single-document updates during drag-and-drop.

**`matchScore` as `Number | null` (Not `Number | undefined`)**
- `null` explicitly means "not yet calculated." `undefined` would mean "field doesn't exist."
- The frontend uses this distinction: if `matchScore === null`, it shows "Upload your resume to see your match score." If `matchScore === 72`, it shows the badge.

### 5.2 User Schema: Resume as Plain Text

I store the resume as `resumeText: String` rather than as a file upload (PDF/DOCX). Reasons:

1. **LLM compatibility** — The AI service needs plaintext to inject into the prompt. PDF parsing adds complexity (external library, layout ambiguity, encoding issues).
2. **Simplicity** — No file storage (S3, Cloudinary) needed. The resume text lives directly in MongoDB.
3. **Token efficiency** — Users paste only the relevant text, avoiding headers, formatting, and page numbers that waste LLM tokens.
4. **Privacy control** — Users see exactly what text the AI is comparing against. No hidden data extraction from a binary file.

---

## 6. Frontend State Management

### 6.1 Why React Query Over Redux/Zustand

JobTrackr has almost no client-only state. Nearly every piece of data (applications, user profile) is **server state** — it lives in the database and the frontend is just a cache.

React Query (`@tanstack/react-query`) is purpose-built for this:
- **Automatic caching** — Applications are fetched once and cached until invalidated.
- **Optimistic updates** — Drag-and-drop and activity addition update the cache immediately, then sync.
- **Background refetching** — Stale data is silently refreshed when the tab regains focus.
- **Mutation lifecycle hooks** — `onSuccess`, `onError`, `onSettled` provide clean side-effect management.

Redux would add 3x the boilerplate for the same result. Zustand is lighter but doesn't provide the cache invalidation and background sync that React Query gives for free.

### 6.2 React Hook Form: The AI Field Problem

When the user clicks "Auto-fill with AI," the LLM returns structured data that must be injected into the form. The challenge:

**react-hook-form strips fields not registered in `defaultValues`.**

If the form was initialized with:
```typescript
defaultValues: { company: '', role: '' }
```

Then calling `setValue('matchScore', 85)` silently fails — `matchScore` is not a registered field.

**Solution:** I explicitly declare every AI-generated field in `defaultValues`:
```typescript
defaultValues: {
  company: '',
  role: '',
  matchScore: null,        // ← registered even though AI fills it
  missingSkills: [],       // ← registered
  resumeSuggestions: [],   // ← registered
  followUpDate: '',        // ← registered
}
```

This is a subtle bug that consumed significant debugging time. Documenting it here because it's exactly the kind of question an interviewer might ask: "What was the hardest bug you encountered?"

---

## 7. Security Considerations

### 7.1 Authentication Flow

```
Registration:
  password → bcrypt.hash(password, salt=12) → stored in MongoDB

Login:
  input → bcrypt.compare(input, storedHash) → JWT signed with HS256
  JWT payload: { userId: ObjectId, iat, exp }
  Token lifetime: 7 days

Every protected request:
  Authorization: Bearer <token>
  → middleware decodes with jwt.verify()
  → attaches req.userId
  → controller queries ONLY this user's data
```

**Key security properties:**
- **Password never stored in plaintext** — bcrypt with cost factor 12 (~250ms per hash, brute-force resistant)
- **Password field excluded from queries** — `userSchema: { password: { select: false } }`
- **Tenant isolation** — Every database query includes `{ userId: req.userId }`. A user can never access another user's applications.
- **Helmet.js** — Sets security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **CORS restricted** — In production, only the specific frontend domain is allowed.

### 7.2 Input Validation

Every API endpoint validates the request body with Zod *before* any database interaction:

```typescript
const data = applicationBaseSchema.parse(req.body);
// If validation fails, Zod throws ZodError → caught by errorHandler → 400 response
```

This prevents:
- **NoSQL injection** — Zod ensures types match (strings are strings, numbers are numbers)
- **Prototype pollution** — Only whitelisted fields pass through
- **Oversized payloads** — `express.json({ limit: '10mb' })` caps body size

---

## 8. Challenges & Solutions

### Challenge 1: MongoDB Atlas IP Whitelisting
**Problem:** My development machine's IP changed frequently (ISP DHCP rotation), causing `MongooseServerSelectionError` timeouts.
**Solution:** Configured Atlas Network Access to allow `0.0.0.0/0` for development. In production, this would be restricted to the deployment server's static IP.

### Challenge 2: OpenAI Rate Limiting
**Problem:** OpenAI's free tier returned `429` errors during rapid development testing.
**Solution:** Migrated to OpenRouter, which provides the same SDK interface with more generous rate limits. The migration required changing only 3 lines of code (baseURL, apiKey, model name).

### Challenge 3: Anti-Bot Protection on Job Boards
**Problem:** LinkedIn, Indeed, and Glassdoor block direct HTTP requests, returning empty HTML or CAPTCHA pages.
**Solution:** A direct request first, then the free Jina Reader, which loads the page in a real browser; if both fail, the user is asked to paste the text. (First built on Scrapingdog; replaced in 2026-11 when its free plan ran out and every URL answered 403.)

### Challenge 4: react-hook-form Stripping AI Fields
**Problem:** AI-generated fields (`matchScore`, `missingSkills`) were silently dropped during form submission because they weren't registered in the form's `defaultValues`.
**Solution:** Explicitly registered all AI fields in `defaultValues` with appropriate initial values (`null` for score, `[]` for arrays).

### Challenge 5: Drag-and-Drop Snap-Back Effect
**Problem:** Updating the server after a drag created a visual delay where the card would "snap back" to its original position before jumping to the new one.
**Solution:** Implemented optimistic local state updates in `onDragOver` (not just `onDragEnd`), so the card visually moves immediately while the API request processes in the background.

---

## 9. Performance Characteristics

| Operation | Latency | Approach |
|:----------|:--------|:---------|
| **Kanban board load** | ~200ms | Single MongoDB query with compound index |
| **Card drag-and-drop** | ~0ms (perceived) | Optimistic update; API fires async |
| **AI JD extraction** | ~10-15s (measured 2026-11-09, free models) | Page fetch + LLM inference; the largest free model took 9.5 s without a resume and 13.2 s with one |
| **CSV export** | ~0ms | Client-side Blob generation, no server round-trip |
| **Dashboard render** | ~50ms | All metrics computed from cached React Query data |
| **Activity addition** | ~150ms | `$push` atomic operation (no full document replacement) |

---

## 10. What I Would Do Differently

If I were starting over with unlimited time:

1. **End-to-end type safety with tRPC** — Instead of duplicating types between frontend and backend, tRPC would provide compile-time API contracts.
2. **Resume PDF parsing** — Accept PDF uploads and use `pdf-parse` to extract text automatically, with a preview step for users to verify.
3. **WebSocket for real-time sync** — If multiple devices track the same account, a WebSocket layer would push updates instantly instead of relying on React Query refetching.
4. **Rate limiting on the AI endpoint** — Currently, a user could spam the parse endpoint. I'd add `express-rate-limit` with a per-user window (e.g., 20 requests/hour).
5. **Integration tests** — Full Supertest + MongoDB Memory Server test suite for every API endpoint.

---

*This document is intended to demonstrate the engineering rigor behind each decision. Every trade-off was made deliberately, with an understanding of what was sacrificed and why.*
