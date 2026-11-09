---
version: 1
slug: "frontend-src-components-kanban-kanbanboard-tsx"
primary_target: "frontend/src/components/kanban/KanbanBoard.tsx"
related_targets: ["frontend/src/pages/LoginPage.tsx","frontend/src/pages/DashboardPage.tsx"]
---

# JobTrackr: login, board, analytics, profile

Mode: Operate. Visitor: a job seeker tracking many applications, and a recruiter who clicks "Continue as guest" first. Task: add postings (AI fills the details), move dockets between five stages, see match and follow-ups, check analytics. Constraints: sample data is labelled as sample; AI runs on free models and can be slow or limited; the API host sleeps and the first request can take about a minute; drag and drop, search, score filter, CSV export, follow-ups, notes, copyable suggestions and profile resume all keep working.

## Direction contract

THESIS: The board is a pin rail of job-bag dockets, not a grid of glass cards. Each application is a flat ruled slip with printed labels and filled-in entries, hung in one of five stage bays. It refuses the dark gradient dashboard with glow, orbs and sparkle icons.

OWN-WORLD: Enamel-grey rail (#D5D9DC), docket stock (#FAF9F4), carbon ink (#1A1D21), ballpoint blue (#1F4E9E) for filled-in entries and links, and one action red (#C23B22) reserved for the docket that needs action today. Sofia Sans Condensed for printed labels and headings, Sofia Sans for entries, tabular numerals. Square corners, 1px ink rules, no shadow, blur or gradient. State is a mark plus a word or number: the match score is a boxed number whose border (double, single, dashed) says its band; a rejected docket carries a CLOSED stamp and stays legible.

STORY: A job seeker sees all five stages at once, sees which dockets need action today, and trusts that sample data is marked as sample. A recruiter opens the guest door, lands on a lived-in board, and can try every feature, including AI fill, with an honest note about free-model limits.

FIRST VIEWPORT: Login: left, a plain statement of what the tool does and four real capabilities; right, a docket headed "Try it first" with Continue as guest as the primary action and sample-data terms, then sign-in and sign-up beneath. Board: ink rule top bar (wordmark, Board, Analytics, Profile, Export CSV, Add application), a guest strip when applicable, a filter row with a line saying how many need action, then five bays side by side with a count tab each, dockets hanging in them.

FORM: Job-Bag Docket (assigned, index 7 of the grounded list), seed key 8e626264.

SIGNATURE: A CLOSED stamp presses onto a docket in Rejected (200 ms settle, skipped under reduced motion). Nothing else animates on entry.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
