# Xartup VC Intelligence — scaffold

This is a minimal scaffold for a Next.js (App Router) TypeScript project with Tailwind, shadcn/ui placeholders, and Zustand.

What is included
- Next.js App Router layout (`app/layout.tsx`) with a persistent `Sidebar` and `Header`.
- Global search input in the header (`components/SearchInput.tsx`).
- Placeholder routes: `/companies`, `/companies/[id]`, `/lists`, `/saved`.
- Zustand store for lists persisted to localStorage (`stores/useListsStore.ts`).

Run locally
1. Install dependencies:

```bash
# from project root
npm install
```

2. Run dev server:

```bash
npm run dev
```

Notes
- `@shadcn/ui` is referenced as a placeholder in `package.json` — integrate the official shadcn/ui components and Tailwind theme tokens as next steps.
- Tailwind/PostCSS are included; run the install step and then `npm run dev`.
