# Petra Health

Cross-platform health tracking for Petra Pharma's **Semetra (Semaglutide)** titration
programme — a mobile app for patients, a Next.js admin portal, and a NestJS + PostgreSQL
backend.

This repo currently implements the **first vertical slice**: authentication (JWT + bcrypt)
and the hierarchical **Country → City → Doctor** directory, end-to-end across all three tiers,
on top of the full database schema (which also models medications, titration weeks, dose logs,
and weight entries for the next slices).

## Structure

```
petra-health/
├─ apps/
│  ├─ api/      NestJS + Prisma  (auth, directory, profile)
│  ├─ web/      Next.js + Tailwind admin portal (directory CRUD)
│  └─ mobile/   Expo (React Native) patient app (auth + onboarding)
├─ packages/
│  └─ shared/   Shared TS types / DTOs (api + web)
├─ docker-compose.yml   PostgreSQL 16
└─ .env.example
```

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) — or a local Postgres and an adjusted `DATABASE_URL`

## Getting started

```bash
# 1. Env
cp .env.example .env

# 2. Install (workspaces: shared, api, web). Mobile installs separately.
npm install
npm run build:shared

# 3. Database
npm run db:up                 # start Postgres in Docker
npm --workspace apps/api run prisma:generate
npm run db:migrate            # create tables
npm run db:seed               # seed directory + Semetra titration + demo users

# 4. Run the API + web portal (separate terminals)
npm run dev:api               # http://localhost:3001/api
npm run dev:web               # http://localhost:3000

# 5. Mobile
cd apps/mobile && npm install && npx expo start
```

### Seed credentials

| Role    | Email                     | Password      |
| ------- | ------------------------- | ------------- |
| Admin   | admin@petrapharma.com     | `Admin123!`   |
| Patient | patient@example.com       | `Patient123!` |

## API surface (this slice)

| Method | Path                          | Auth        | Purpose                          |
| ------ | ----------------------------- | ----------- | -------------------------------- |
| POST   | `/api/auth/signup`            | –           | Patient signup                   |
| POST   | `/api/auth/login`             | –           | Patient login                    |
| POST   | `/api/auth/admin/login`       | –           | Admin login                      |
| GET    | `/api/directory/countries`    | –           | List countries                   |
| GET    | `/api/directory/cities`       | –           | List cities (`?countryId=`)      |
| GET    | `/api/directory/doctors`      | –           | List doctors (`?cityId=`)        |
| POST/PUT/DELETE | `/api/directory/*`   | admin JWT   | Directory CRUD                   |
| GET    | `/api/profile/me`             | user JWT    | Current patient                  |
| PUT    | `/api/profile`                | user JWT    | Save onboarding selection        |

## Semetra titration model

`Medication → Pen → TitrationWeek`. The seed encodes the patient guide exactly:

- **First Pen (1.5 ml):** weeks 1–4 = 0.25 mg, weeks 5–6 = 0.50 mg
- **Second Pen (1.5 ml):** weeks 1–4 = 0.50 mg

## Security notes

- Passwords hashed with **bcrypt** (12 rounds).
- All authenticated endpoints use **JWT** bearer tokens; admin routes additionally require the
  `admin` principal type.
- `helmet` sets security headers incl. HSTS; deploy behind TLS so all traffic is HTTPS.
- Relational integrity via FK constraints (Doctor → City → Country), with extra checks that a
  doctor's city actually belongs to its country.

## Roadmap (next slices)

- Medication logging UI + the weekly Semetra checklist
- Offline local push reminders (expo-notifications)
- Weight entry + trend line chart
- Admin analytics dashboard (active users, logs, regional distribution)
- Biometric unlock (FaceID / fingerprint)
