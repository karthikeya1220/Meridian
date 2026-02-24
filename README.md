# Xartup — VC Intelligence Scaffold

A compact Next.js App Router TypeScript scaffold demonstrating a production-minded architecture for thesis-driven VC intelligence. It includes:

- Deterministic signal and scoring engines (explainable rules)
- Server-side LLM extraction + validation endpoint (`/api/enrich`)
- Client enrichment UI with TTL caching and graceful error handling
- Zustand store for lists & saved-searches persisted to localStorage
- Lightweight UX primitives: toasts, error boundary, mobile client shell

Live demo

- Live demo: (not deployed) — replace with your deployment URL after you push (e.g. Vercel).

Product overview

- Browse mock company data and evaluate each company against a configurable thesis.
- Use the server-side enrichment pipeline to extract site content (home / about / careers), ask an LLM for a strict JSON facts object, validate it with Zod, and return structured facts + sources.
- Run deterministic signals locally (developer focus, hiring, recent activity) and compute an explainable score.

Quickstart (developer)

Prereqs

- Node.js 18+ (use nvm or Volta recommended)
- zsh (macOS default) — commands below are for zsh

Install

```bash
# from project root
npm install
```

Run dev

If you hit a stale Next dev lock (`.next/dev/lock`) remove it or kill the process first:

```bash
# find a process listening on port 3000 (if any)
lsof -i :3000 -sTCP:LISTEN
# kill it if needed (replace <PID>)
kill <PID>

# or remove a stale Next dev lock
rm -f .next/dev/lock

# start dev server
npm run dev
```

Build

```bash
npm run build
npm run start
```

Environment variables

Create a `.env.local` at the repo root with at least:

```env
# OpenAI API key (server only). NEVER use NEXT_PUBLIC_* for secret keys
OPENAI_API_KEY=sk-...

# Optional: extractor base if you self-host an extractor
# EXTRACTOR_BASE=https://r.jina.ai
```

Important: The enrichment route reads `process.env.OPENAI_API_KEY` server-side only. Do not expose secrets to the browser.

Project layout and architecture

- `app/api/enrich/route.ts` — Server-side enrichment endpoint. Fetches site text (home/about/careers), calls OpenAI with a strict prompt requesting only JSON, validates with Zod (`CompanyFacts`), retries once on parse failure, and returns `{ extract, sources, timestamp }`.
- `lib/signal-engine.ts` — Deterministic functions that convert validated `CompanyFacts` into explainable `Signal[]` values.
- `lib/scoring.ts` — Combines `THESIS` (weights) and derived signals into a single explainable `ScoreResult`.
- `lib/mock-data.ts` — Mock companies used by the UI and store.
- `stores/useAppStore.ts` — Zustand store for companies, selectedCompanies, lists, and savedSearches. Persists to localStorage.
- `components/EnrichmentPanel.tsx` — Client enrichment UI. Calls `/api/enrich`, caches result with 24h TTL in localStorage, uses `deriveSignals` and `scoreCompany` client-side to show signals and score.
- `components/ToastProvider.tsx`, `components/ErrorBoundary.tsx`, `components/ClientShell.tsx` — Small UX primitives (toasts, error boundary, client shell with mobile sidebar).
- `app/companies`, `app/lists`, `app/saved` — Main user-facing pages for browsing, saving, and exporting companies/searches.

Runtime & deployment notes

- The enrichment endpoint must run server-side and will read `OPENAI_API_KEY`. On serverless platforms (Vercel) watch request timeouts — enrichment may exceed very short execution windows. Consider an async queue for production.
- Some files set `runtime = 'edge'` for experiments — confirm the OpenAI client usage is compatible with edge runtimes or switch to Node runtime.
- Tailwind CSS is pinned to v3.x in this project to avoid PostCSS plugin compatibility issues with older PostCSS versions.

Known limitations

- Proof-of-concept — not production hardened:
  - No authentication or authorization on `/api/enrich`.
  - No rate limiting or per-user quotas; potential for high-cost LLM calls.
  - Client-side cache uses `localStorage` (per-browser) — not suitable for team/shared caches.
  - No end-to-end tests for LLM integration or scoring logic.
  - Reliance on public extractor endpoints (r.jina.ai) for page extraction; consider a stable, monitored extractor in production.

Stretch targets / recommended next work

- Add unit tests (Vitest / Jest) for `deriveSignals` and `scoreCompany`.
- Add integration tests for `/api/enrich` with mocked OpenAI responses and parsing scenarios.
- Add persistent server-side caching (Redis) for enrichment results and share between users.
- Protect `/api/enrich` with authentication and rate-limiting (API key or user-based). Add billing or quota enforcement.
- Background enrichment queue (BullMQ / Redis) to handle long-running enrichment tasks and avoid blocking short-lived serverless runtimes.
- UI improvements: bulk-enrich, job progress, richer saved-search builder (operators, ranges), confirm modals, and better list management UX.
- Observability: add Sentry/Datadog traces for enrichment latency and LLM parsing failures.

Contributing

- Run the app locally, open the code in VS Code, and iterate on files in `lib/` and `components/`.
- Please add tests when you modify `lib/signal-engine.ts` or `lib/scoring.ts`.

Maintainer

- Update this file with your contact details or team information.

License

- MIT (add a LICENSE file if needed).

If you'd like, I can also:

- Attempt to remove a stale `.next/dev/lock` and start the dev server here to run a quick smoke test of the Enrichment flow.
- Add unit tests for the signal & scoring engines.

Choose one action and I will proceed.
