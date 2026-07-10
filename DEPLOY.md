# Deploying Petra Health (Render + Vercel)

Test deployment: **API + PostgreSQL on Render**, **admin portal on Vercel**, **mobile via Expo Go**
pointed at the live API.

```
 Expo Go (phone) ─┐
                  ├──►  Render: NestJS API  ──►  Render: PostgreSQL
 Vercel: Next.js ─┘        (HTTPS)
```

---

## 0. Push the code to GitHub

The repo is already committed locally. Create an **empty** repo on github.com (no README),
then from `C:\Users\Test-1\petra-health`:

```bash
git remote add origin https://github.com/<your-username>/petra-health.git
git branch -M main
git push -u origin main
```

---

## 1. Render — PostgreSQL + API (do this first, it mints the API URL)

1. Render dashboard → **New → Blueprint**.
2. Connect your GitHub and pick the `petra-health` repo. Render reads [`render.yaml`](render.yaml)
   and proposes a **Postgres database** + a **web service** (`petra-health-api`).
3. Click **Apply**. First build takes a few minutes — it installs deps, builds the shared package
   and API, runs `prisma db push` (creates tables), and seeds demo data.
4. When live, note the URL, e.g. `https://petra-health-api.onrender.com`.
   - Health check: open `https://<api>/api/directory/countries` → should return a JSON array
     containing **Iraq**'s cities' doctors once seeded.

**What the blueprint sets automatically:** `DATABASE_URL` (from the DB), a generated `JWT_SECRET`,
`JWT_EXPIRES_IN`, `NODE_VERSION`. You'll set **`CORS_ORIGINS`** in step 3.

> Free tier notes: the API sleeps after ~15 min idle (first request then cold-starts ~30–50s), and
> the free Postgres instance expires after 30 days. Fine for testing.

---

## 2. Vercel — Next.js admin portal

1. Vercel dashboard → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** set to **`apps/web`** (important — this is a monorepo).
   Vercel will read [`apps/web/vercel.json`](apps/web/vercel.json), which builds the shared
   package before `next build`.
3. **Environment Variable:** add
   - `NEXT_PUBLIC_API_URL` = your Render API base URL from step 1 (e.g.
     `https://petra-health-api.onrender.com`) — **no trailing slash**.
4. **Deploy.** You'll get a URL like `https://petra-health.vercel.app`.

---

## 3. Close the loop — CORS

Back in **Render → petra-health-api → Environment**, set:

- `CORS_ORIGINS` = your Vercel URL (e.g. `https://petra-health.vercel.app`).
  Comma-separate if you add preview domains.

Save → the service redeploys. Now the admin portal (browser) can call the API.

**Log in** at the Vercel URL with `admin@petrapharma.com` / `Admin123!` and manage the directory.

---

## 4. Mobile (Expo Go)

In `apps/mobile/.env` set the API to your Render URL, then start Expo:

```
EXPO_PUBLIC_API_URL=https://petra-health-api.onrender.com
```

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR with **Expo Go**. Log in as `patient@example.com` / `Patient123!`, or sign up, then
walk the Country → City → Doctor onboarding. (A physical device works because it calls the public
Render HTTPS URL — no LAN IP needed.)

---

## Seed credentials

| Role    | Email                 | Password      |
| ------- | --------------------- | ------------- |
| Admin   | admin@petrapharma.com | `Admin123!`   |
| Patient | patient@example.com   | `Patient123!` |

## Troubleshooting

- **Web login fails / CORS error in console** → `CORS_ORIGINS` on Render doesn't exactly match the
  Vercel origin (scheme + host, no path/slash). Fix and redeploy.
- **401 on admin routes** → you logged in via the patient endpoint; the portal uses
  `/api/auth/admin/login` automatically, so use the admin credentials above.
- **Render build fails on `prisma db push`** → the DB wasn't ready; re-run the deploy (the database
  provisions in parallel on first blueprint apply).
- **First API call is slow** → free-tier cold start; retry after ~30s.
- **Schema changes later** → this test setup uses `prisma db push` (no migration history). For a
  real environment, generate migrations (`prisma migrate dev`) and switch the blueprint to
  `prisma migrate deploy`.
