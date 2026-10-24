# Meme'd Campaign Payout Tracker

Meme'd is a creator marketplace demo. Brands publish Instagram or YouTube campaigns with a fixed budget and view-based reward ladder. Creators submit public post links, then see simulated view counts and earnings.

## Live app

- **Frontend:** [meme-d-campaign-payout-tracker-rouge.vercel.app](https://meme-d-campaign-payout-tracker-rouge.vercel.app)
- **Backend health:** [meme-d-campaign-payout-tracker-1l0u.onrender.com/api/health](https://meme-d-campaign-payout-tracker-1.onrender.com/api/health)
- **Repository:** [Meme-d-Campaign-Payout-Tracker](https://github.com/jainabhishek2004/Meme-d-Campaign-Payout-Tracker)

## Features

### Accounts

- Email and password signup/login with `brand` and `creator` roles.
- Google sign-in. A new Google account chooses a role during signup; an existing email account can be linked to its Google account and keeps its existing role.
- Passwords are hashed before storage. API routes use JWT authentication and role checks where required.

### Brand workspace

- Create an Instagram or YouTube campaign with a budget and milestone ladder.
- See campaigns with spent and remaining budget.
- Campaign inputs are checked by the backend: supported platform, positive finite budget and payouts, whole-number positive view thresholds, unique thresholds, increasing payouts, and milestone payouts no greater than the campaign budget.

### Creator workspace

- Browse active campaigns, filter by platform, search by campaign or brand name, and refresh the list.
- Submit a post URL to a campaign and view each submission's views and earned payout.
- See total earnings. The earnings view refreshes submission data every 30 seconds while open; view counts themselves are simulated through the update control and are not fetched from Instagram or YouTube.
- The frontend prevents submitting a lower view count and explains the error. The backend also stores the maximum view count seen, so a lower update cannot reduce stored views or payout.

### Payouts, budget and duplicate handling

- A post earns the payout for its highest reached milestone; milestone payouts are not added together.
- A campaign's budget is shared by all its submissions. Each view update calculates only the increase over that submission's current payout.
- The amount added to a creator's payout is capped at the campaign's remaining budget. If only part of the requested increase fits, that remainder is assigned to the submission and the response marks the payout as capped.
- Budget and submission changes run in one MongoDB transaction. Conditional writes and transaction retries protect concurrent updates from double allocation and campaign overspending. If a write fails, both changes roll back.
- A campaign with no remaining budget rejects new submissions in the backend. Campaigns remain marked `active` and may still appear in the browse list after their budget is exhausted; submission is rejected when attempted.
- Post links are normalized before saving to catch common URL variants and tracking parameters. One creator cannot submit the same normalized post twice to the same campaign. The same post can be submitted to a different campaign, or by a different creator.
- View updates are unauthenticated because the assignment describes this endpoint as a platform-data simulator. Treat it as a demo endpoint: anyone who knows a submission ID can call it. A production integration should authenticate platform webhooks or protect this route.

### Additional features

- Active campaign results are cached for 60 seconds in Redis when Redis is available. The API falls back to a process-local memory cache if Redis cannot be reached. New campaign creation clears the active-campaign cache.
- Submissions are flagged when a view increase exceeds the configured velocity or sudden-jump thresholds. This is a review signal, not proof of fraud.
- Docker Compose starts the frontend, backend, Redis, and a single-node MongoDB replica set for local development.

## Technology

- **Backend:** Node.js, TypeScript, Express, Mongoose, MongoDB
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Auth:** JWT, bcryptjs, Google Identity Services
- **Tests:** Jest, ts-jest, mongodb-memory-server
- **Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas

## Project layout

```text
backend/
  src/controllers/   Request handlers and business rules
  src/middleware/    JWT/role checks and error handling
  src/models/        User, campaign and submission schemas
  src/routes/        Express API routes
  src/tests/         Payout, budget, URL and concurrency tests
  src/utils/         Payout, URL normalization, cache and spike logic
frontend/
  app/               Login, signup and role dashboards
  components/        Shared dashboard, campaign and submission UI
  lib/               API client and auth state helpers
docker-compose.yml   Local full-stack setup
.env.example         Root Compose environment sample
```

## Run locally

### Requirements

- Node.js 20 or newer and npm
- MongoDB running as a replica set (MongoDB Atlas works), because payout and eligibility updates use transactions
- Optional: Docker Desktop with Docker Compose
- Optional: Google OAuth Web client ID for Google sign-in

### Backend and frontend separately

In one terminal:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, set `MONGODB_URI` to a replica-set MongoDB URI and replace `JWT_SECRET` with a long random value. Then run:

```bash
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

### Run with Docker Compose

From the repository root, copy `.env.example` to `.env` and set a private `JWT_SECRET`. Then:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API is available on port `5000`. Compose starts MongoDB as a single-node replica set so transactions work locally. MongoDB and Redis data are stored in Docker volumes. To stop the services while keeping their data, run `docker compose down`.

The frontend's `NEXT_PUBLIC_*` values are included during its Docker build. Rebuild the frontend after changing those values.

## Environment variables

The repository includes samples at `.env.example`, `backend/.env.example`, and `frontend/.env.example`. Never commit real `.env` files or OAuth client secrets.

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `MONGODB_URI` | Yes | MongoDB connection string. Use Atlas or a local replica set. |
| `JWT_SECRET` | Yes | Private signing key. The server exits on startup if it is missing. |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `7d`. |
| `FRONTEND_URL` | For deployed frontend | Exact allowed frontend origin for CORS, with no trailing slash. Localhost:3000 is also allowed. |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth Web client ID. |
| `REDIS_URL` | No | Redis connection URL; defaults to `redis://localhost:6379`. In-memory cache is used if Redis is unavailable. |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL, e.g. `http://localhost:5000` or the deployed Render service URL. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | Same Google OAuth Web client ID as the backend. This is public by design. |

For Google sign-in, create a **Web application** OAuth client and add `http://localhost:3000` and the exact deployed frontend origin to its **Authorized JavaScript origins**. This app uses Google's browser credential flow, so it does not need an OAuth redirect URI. Set the client ID in both backend and frontend variables. The app does not use the OAuth client secret.

For Render, set `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, and (if enabled) `GOOGLE_CLIENT_ID`. For Vercel, set `NEXT_PUBLIC_API_URL` and (if enabled) `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, then redeploy after changing frontend variables.

## API overview

All request and response bodies are JSON. Protected routes expect `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Create an email/password account with name, email, password and role. |
| `POST` | `/api/auth/login` | Public | Log in with email and password. |
| `POST` | `/api/auth/google` | Public | Verify a Google credential; new users provide a role to finish signup. |
| `GET` | `/api/campaigns` | Public | List active campaigns. |
| `POST` | `/api/campaigns` | Brand | Create a campaign. |
| `GET` | `/api/campaigns/my` | Brand | List the signed-in brand's campaigns. |
| `GET` | `/api/campaigns/:id` | Owning brand | Get one campaign with its budget details. |
| `POST` | `/api/submissions` | Creator | Submit a post link to an active, funded campaign. |
| `GET` | `/api/submissions/my` | Creator | List the creator's posts and total earnings. |
| `PATCH` | `/api/submissions/:id/views` | Public simulator endpoint | Set simulated views and allocate any eligible payout increase. Body: `{ "views": 10000 }`. |
| `GET` | `/api/health` | Public | Check backend availability. |

## Tests

Run from `backend/`:

```bash
npm test
```

The repository contains **18 unit tests across three suites**, plus **3 MongoDB replica-set integration tests** (21 test cases across four suites total):

- `payout.test.ts`: highest milestone payout selection, including exact thresholds and unsorted input.
- `budget.test.ts`: payout deltas, remaining-budget cap, unchanged payouts, and lower calculated payouts.
- `normalizePostLink.test.ts`: common Instagram/YouTube URL variants, tracking parameters and invalid URL schemes.
- `payoutConcurrency.integration.test.ts`: simultaneous updates to one post, separate posts sharing one budget, and rollback after an injected database write failure.

The integration suite starts an ephemeral replica set with `mongodb-memory-server`; its first run may download a MongoDB binary. MongoDB's transaction helper retries transient transaction errors. If retries fail, or a database write fails, the transaction aborts and leaves the campaign and submission unchanged. These guarantees depend on MongoDB running as a replica set or sharded cluster and on payout writes going through this transaction path.

## Assumptions and edge-case behavior

1. **Highest tier is the payout.** A post at 60,000 views on a ladder of `10,000 -> INR 500`, `50,000 -> INR 2,000`, `100,000 -> INR 5,000` earns INR 2,000, not the sum of lower tiers.
2. **Payouts do not go backwards.** Lower view updates are accepted by the API but cannot lower the saved view count or payout. Views must be non-negative safe integers.
3. **A partial final payout is allowed.** If only INR 300 remains and the next payout increase would be INR 1,000, the post receives INR 300 and the response sets `capped: true`. That partial amount is recorded as its current payout; later updates cannot add more once no budget remains.
4. **The budget is shared.** All creators' submissions compete for one campaign budget. The transaction updates budget spent and submission payout together.
5. **Eligibility is checked when submitting.** Inactive campaigns and campaigns with no remaining budget reject submissions in a transaction. A campaign is not automatically changed to `completed` when its budget reaches zero.
6. **Duplicate scope is one creator and one campaign.** Common tracking and host variations are normalized. The same normalized post URL is rejected for that creator/campaign pair; a creator may use the same post in another campaign.
7. **Platform must match.** Instagram campaigns accept Instagram links; YouTube campaigns accept YouTube links. Only supported public URL formats are intended; this is URL validation, not a check that the post exists or is publicly viewable.
8. **View counts are simulated.** No platform API is connected. The unauthenticated update route follows the assignment's simulator requirement and must not be treated as a trusted production ingestion endpoint.

## Deployment checklist

- Publish the GitHub repository so reviewers can access it.
- Deploy the frontend to Vercel and backend to Render; use MongoDB Atlas for the database.
- Set the environment variables above. Use the exact Vercel origin in Render's `FRONTEND_URL` and Google's Authorized JavaScript origins.
- Ensure the MongoDB deployment supports transactions (Atlas does).
- Make the Vercel **Production** deployment public so the link opens in a private/incognito window.
- Verify the frontend loads, `/api/health` returns `{ "status": "ok" }`, and signup, login, campaign creation, submission, and simulated payout flows work on the deployed app.

## Scaling to 10,000 creators

The current app is a small demo. For 10,000 creators, I would run multiple stateless API instances behind a load balancer, use MongoDB Atlas with indexes on creator, campaign, status and submission lookup fields, and paginate campaign and submission lists. Redis can cache active campaigns across instances with explicit invalidation when campaign data changes. View events should enter a durable queue and be processed by workers, ordered per campaign or otherwise serialized around its budget. Each worker would retain the current atomic transaction so simultaneous events cannot overspend. I would also add rate limits, retry/dead-letter handling, metrics and alerts, and replace simulated counts with authenticated platform webhooks or scheduled platform API syncs. This separates traffic spikes from database writes while keeping payout accounting auditable.
