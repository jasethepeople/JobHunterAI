# JobHunterAI

**JobAI** — an AI-powered job search assistant exported from Replit (`replit.com/@truthinformatio/JobHunterAI`). A full-stack app that automates resume generation, cover letter creation, and job application tracking.

## Features

- **AI resume & cover letter generation** — OpenAI API integration on the backend (`server/services/`) generates tailored resumes and cover letters.
- **Job tracking dashboard** — job cards, search filters, stats cards, interview tracker, and phone tracker components.
- **Job search** — a remote-job-search component for finding and filtering positions.
- **Auth & sessions** — Passport local auth with Express sessions (`server/routes.ts`, `server/storage.ts`).
- **PostgreSQL persistence** — Drizzle ORM schema in `shared/schema.ts` (users, profiles, skills, experience, education, job applications); seed script at `server/seed.ts`.
- Full shadcn/ui component library, dark/light theming (`next-themes`), and charts (`recharts`).

## Tech stack

React 18 + TypeScript (Wouter routing, TanStack Query, Vite), Express 4 + TypeScript, PostgreSQL via Drizzle ORM (Neon serverless), OpenAI API, Tailwind CSS + shadcn/ui, Passport.

## Getting started

From `package.json` and `replit.md`:

- `npm run dev` — dev server (`tsx server/index.ts`)
- `npm run build` — `vite build` + esbuild server bundle to `dist/`
- `npm start` — production server (`node dist/index.js`)
- `npm run check` — TypeScript check
- `npm run db:push` — push Drizzle schema (`drizzle.config.ts`)
- Requires `DATABASE_URL` (Postgres) and an OpenAI API key.

## Project structure

```
.
├── client/        # React frontend (src/components/, src/pages/)
├── server/        # Express API (routes.ts, storage.ts, services/, seed.ts)
├── shared/        # shared TypeScript types and Drizzle schema (schema.ts)
├── drizzle.config.ts
└── vite.config.ts
```

## Status

**Real project.** A complete full-stack Replit app; `replit.md` documents the architecture and database schema. The GitHub description points to https://replit.com/@truthinformatio/JobHunterAI.
