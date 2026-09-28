# tablecn-clone

A from-scratch clone of [tablecn.com](https://tablecn.com) — the shadcn/ui +
TanStack Table advanced data-table showcase — built as a full-stack app per
your spec:

| Your requirement | What's used |
|---|---|
| MERN-style full stack | **N**ext.js frontend, **Hono** backend (instead of Express — same idea, edge/serverless-friendly), **Postgres** (Mongo swapped for Postgres since the table needs relational filtering/sorting/faceting that Drizzle+SQL does natively and efficiently; see note below) |
| shadcn/ui | Hand-built shadcn primitives (button, table, dropdown, popover, command, sheet, dialog, select, checkbox, badge, etc.) — same code shadcn's CLI would generate |
| TanStack Table | `@tanstack/react-table` v8, manual pagination/sorting/filtering (server-driven) |
| Next.js frontend | App Router, Server Components, Suspense streaming |
| Hono backend | Full CRUD + faceted-count API mounted at `/api/*` via `hono/vercel`, deployed as Vercel serverless functions |
| Postgres | Drizzle ORM schema + migrations + seed script |
| Server actions + better-fetch | `src/app/actions/tasks.ts` — Next.js server actions that call the Hono API using `@better-fetch/fetch` |
| Deployed on Vercel | One Next.js project; `/api` routes and the app ship together |

## Why Postgres instead of MongoDB

You said "Mongo/Postgres" (either is fine). tablecn.com's actual advanced
table features — multi-column sort, per-column filter operators, `AND`/`OR`
filter groups, faceted counts, range/date filters — map directly onto SQL
`WHERE`/`GROUP BY` and are what the real tablecn.com (shadcn-table) uses
under the hood. I used Postgres via Drizzle for that reason. If you need
MongoDB specifically (e.g. because the assignment grades on it), say so and
I'll swap `src/server/db` and the query builder to Mongoose/Prisma-Mongo —
the Hono routes and frontend won't need to change, only the query builder.

## Feature checklist (tablecn.com parity)

- [x] Server-side pagination (page, page size)
- [x] Multi-column sorting (via column header dropdown)
- [x] Per-column filtering (text, faceted multi-select)
- [x] Faceted filters with live counts (status / label / priority)
- [x] Global title search (debounced via URL state)
- [x] Column visibility toggle
- [x] Column resizing
- [x] Row selection + floating bulk action bar (bulk delete, bulk status update)
- [x] Row actions menu (edit, duplicate, delete)
- [x] Create/edit task via slide-over Sheet form
- [x] CSV export (respects visible columns + current filters/selection)
- [x] Loading skeletons matching table shape
- [x] URL-driven state (nuqs) — filters/sort/page are shareable/bookmarkable links, exactly like tablecn.com
- [ ] Advanced filter builder UI (AND/OR condition rows) — the backend (`filters` + `joinOperator` query params, `buildFilterCondition`) already supports this; only the UI panel for adding arbitrary condition rows is not wired up yet. See "What's left" below.
- [ ] Column drag-to-reorder — not yet implemented (`@dnd-kit` would slot into `data-table.tsx`'s header row)
- [ ] Column pinning — not yet implemented

## Project structure

```
src/
  app/
    api/[[...route]]/route.ts   # mounts the Hono app for Vercel
    actions/tasks.ts            # server actions (better-fetch -> Hono API)
    tasks/page.tsx              # the main page (RSC, Suspense)
    layout.tsx, page.tsx, globals.css
  server/
    db/                         # Drizzle schema, client, migrate, seed
    hono/                       # Hono app, zod validators, SQL query builder
  components/
    ui/                         # shadcn primitives
    data-table/                 # generic, reusable TanStack Table pieces
    tasks/                      # task-specific columns, badges, forms
  lib/                          # cn(), better-fetch client, nuqs parsers, CSV export
  types/                        # shared Task / query / response types
```

## Local setup

This code was written in a sandboxed environment with no network access, so
it has **not** been through `npm install` / `next build` here — you'll need
to do that once, locally or in CI. The code follows current Next.js 14 / Hono
4 / Drizzle 0.36 / TanStack Table v8 APIs, but double-check versions if a
newer major has shipped since.

```bash
npm install

# Point at any Postgres 14+ instance (Neon is the easiest free option)
cp .env.example .env
# edit .env and set DATABASE_URL=postgresql://...

npm run db:generate   # generates SQL migration from schema.ts
npm run db:migrate    # applies it
npm run db:seed       # inserts ~500 fake tasks (set SEED_COUNT to change)

npm run dev           # http://localhost:3000 -> redirects to /tasks
```

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Create a free Postgres database — [Neon](https://neon.tech) or Vercel's
   own Postgres (Storage tab in your Vercel dashboard) both work.
3. In Vercel: **New Project → Import your repo**.
4. Add environment variable `DATABASE_URL` (Production + Preview) with your
   connection string. Leave `NEXT_PUBLIC_APP_URL` unset — it's derived from
   `VERCEL_URL` automatically in production.
5. Deploy. Vercel will run `next build`, which also builds the `/api/*`
   route handlers as serverless functions — no separate backend deployment
   needed.
6. Run migrations + seed against the production DB once, from your machine:
   ```bash
   DATABASE_URL="<your prod connection string>" npm run db:migrate
   DATABASE_URL="<your prod connection string>" npm run db:seed
   ```
7. Visit `https://<your-project>.vercel.app` → redirects to `/tasks`.

Or via CLI end-to-end:
```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL production
vercel --prod
```

## What's left to reach 100% parity

Given the scope of tablecn.com, three pieces are stubbed at the backend
level but not yet exposed in the UI:

1. **Advanced filter builder panel** — a popover where users add arbitrary
   `column / operator / value` rows joined by AND/OR. The Hono API already
   accepts this shape (`filters` + `joinOperator` params, see
   `src/server/hono/validators.ts` and `query-builder.ts`); it just needs a
   React panel that serializes to that shape instead of the simple faceted
   filters currently wired up.
2. **Drag-to-reorder columns** — would use `@dnd-kit/core` +
   `@dnd-kit/sortable` around the header row in `data-table.tsx`, persisting
   order to a `columnOrder` table state (and optionally to the URL).
3. **Column pinning** — TanStack Table has this built in
   (`column.pin("left")`); needs sticky-position CSS on `TableHead`/`TableCell`
   and a menu item to trigger it.

None of these require backend changes beyond #1's filter panel — happy to
build any of them out further if you tell me which matters most for grading.
