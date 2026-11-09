# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **A job seeker tracking many applications** over weeks: pasting postings in, moving cards between stages, checking which roles match their resume, and remembering follow-ups. Daily use, often on a laptop, sometimes a phone.
2. **A recruiter or engineer** who opens the live demo from a CV or GitHub and decides within ten seconds whether the work is real. They will click "Continue as guest" first.

## Product Purpose

JobTrackr is an application tracker with an AI assist. A posting (URL or pasted text) is parsed into company, role, location, salary and skills; if the user has saved a master resume, the same call scores the match, lists missing skills and suggests resume edits. Success is a board the user trusts and updates in seconds.

## Positioning

The tracker scores each posting against **the user's own resume** and keeps the result on the card, so the board also tells them where to spend effort. A plain kanban board does not do that.

## Operating Context

- Five stages: Applied, Phone Screen, Interview, Offer, Rejected. Drag and drop with optimistic updates; the order inside a column is kept.
- Search by company or role, filter by match score band (80+, 60 to 79, under 60), export all applications to CSV, follow-up dates with colour-coded urgency (past due, within two days).
- Per application: match score, required and missing skills, resume suggestions (copyable), an activity timeline with notes, edit and delete.
- A separate analytics page: funnel, match-score distribution, 28-day activity, most common missing skills.
- A profile page holds the master resume text.
- **Guest session:** one click creates a throwaway account with six sample applications (made-up companies) and a short sample resume. It is deleted after 24 hours. The deployment allows at most 200 guest sessions at once.
- **AI runs on free OpenRouter models** (about 50 requests a day in total). Parsing can be slow (20 to 45 seconds), can fail when the free tier is busy, and can hit the daily limit.
- **The API runs on a free host that sleeps when idle**, so the first request after a pause can take about a minute.

## Capabilities and Constraints

Must keep working: login, register, guest session, drag and drop, search and score filter, CSV export, add application with AI parse by URL or text, application details with edit, delete, notes and copyable suggestions, analytics page, profile resume save, sign out, route protection.

Not allowed: invented users, metrics or accuracy figures; presenting sample data as the visitor's own; claiming a model name or accuracy for the AI; "real-time" claims.

## Brand Commitments

- Name: JobTrackr.
- Purpose decision (user, 2026-11-09): a calm daily-use tool, not a showpiece.
- The login page leads with the guest door ("try it with sample data"); sign-in and sign-up sit beside it.
- One honest line near AI Auto-Fill says the AI runs on free models and can be slow or hit a daily limit.
- Guest sessions are labelled as sample data inside the app.

## Evidence on Hand

- Live demo: https://job-trackr-beryl.vercel.app (frontend), API on Render.
- Repository: github.com/sahilsahu4102/JobTrackr.
- Six sample applications and a sample resume exist in `server/src/data/guestSeed.ts`, all made up. There are no testimonials, user counts or usage figures, and none may be invented.

## Product Principles

1. **The board is the product.** The first screen after sign-in is the board, with its controls reachable and nothing decorative above it.
2. **Say what is sample, what is AI, and what can fail.**
3. **Honest waiting.** Slow AI calls and a sleeping server get a clear message and visible progress, never a frozen control.
4. **Colour is information:** match score and follow-up urgency only, always with a word or number beside it.
5. **Dense but calm:** a user with fifty cards should still read the board at a glance.

## Accessibility & Inclusion

WCAG AA contrast, visible keyboard focus, drag and drop that also works from the keyboard (it does today via dnd-kit; keep it), reduced motion respected, no horizontal page scroll at 390 px (the board may scroll sideways inside its own region).
