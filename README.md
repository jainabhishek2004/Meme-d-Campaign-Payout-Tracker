# Meme'd — Campaign Payout Tracker

A full-stack web application where brands create influencer campaigns with milestone-based payout ladders, and creators submit posts to earn money based on view counts.

**Live Demo:** [https://meme-d-campaign-payout-tracker-rouge.vercel.app/](https://meme-d-campaign-payout-tracker-rouge.vercel.app/) 
**Backend API:** [https://meme-d-campaign-payout-tracker-1l0u.onrender.com/](https://meme-d-campaign-payout-tracker-1l0u.onrender.com/) 

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Stretch Goals Implemented](#stretch-goals-implemented)
- [Scaling to 10,000 Creators](#scaling-to-10000-creators)

---

## Features

**For Brands**
- Sign up / log in as a Brand
- Create campaigns with a name, platform (Instagram / YouTube), total budget, and a milestone ladder
- View each campaign's budget spent vs. remaining with a visual progress bar
- Milestone ladder displayed per campaign

**For Creators**
- Sign up / log in as a Creator
- Browse all live (active) campaigns
- Submit a post link to any active campaign
- Track earnings across all submissions
- Simulate view updates directly from the dashboard

**Payout Engine**
- Payout = highest milestone the post has crossed (not additive)
- Budget cap: a campaign never pays out more than its total budget
- Idempotent: re-sending the same view count produces no duplicate charge
- Race-condition safe: MongoDB transactions commit the campaign budget and submission payout together, preventing duplicate allocation and overspending

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Backend     | Node.js · TypeScript · Express · MongoDB (Mongoose) |
| Auth        | JWT (jsonwebtoken · bcryptjs)                       |
| Frontend    | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Testing     | Jest · ts-jest                                      |
| Deployment  | Render (backend) · Vercel (frontend) · MongoDB Atlas|

---

## Architecture

```
Memed/
├── backend/                 # Express API
│   ├── src/
│   │   ├── models/          # Mongoose schemas (User, Campaign, Submission)
│   │   ├── routes/          # Route definitions
│   │   ├── controllers/     # Business logic handlers
│   │   ├── middleware/       # Auth (JWT), error handler
│   │   ├── utils/
│   │   │   └── payoutCalculator.ts   # Pure payout + budget-cap logic
│   │   └── tests/           # Jest unit tests
│   ├── .env.example
│   └── package.json
│
└── frontend/                # Next.js 14 App
    ├── app/
    │   ├── (auth)/          # Login & Signup pages
    │   └── dashboard/
    │       ├── brand/       # Brand dashboard + create campaign
    │       └── creator/     # Creator dashboard
    ├── components/          # Navbar, CampaignCard, MilestoneInput, SubmissionCard
    ├── lib/
    │   ├── api.ts           # Fetch wrappers for all API calls
    │   └── auth.ts          # Token/cookie management
    ├── types/index.ts       # Shared TypeScript interfaces
    ├── middleware.ts        # Route protection (dashboard/* requires auth + role)
    └── .env.example
```

---

## Setup Guide

### Prerequisites

- Node.js ≥ 18
- A MongoDB Atlas cluster (free tier works) **or** a local MongoDB replica set (transactions do not work on a standalone MongoDB server)
- Git
- Docker Desktop with Docker Compose (optional, for the containerized setup below)

### Run the full stack with Docker Compose

From the repository root, create a local environment file and replace the sample JWT secret with a long random value:

```bash
cp .env.example .env
```

Then build and start the frontend, backend, MongoDB replica set, and Redis:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API health check is available at [http://localhost:5000/api/health](http://localhost:5000/api/health). MongoDB is initialized as a single-node replica set so payout transactions work locally; its data and the Redis cache persist in Docker volumes. The frontend API URL is a build-time setting (`NEXT_PUBLIC_API_URL` in the root `.env`), so rebuild the frontend after changing it.

Stop the containers with `docker compose down`. MongoDB and Redis data remain in their Docker volumes.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/memed.git
cd memed
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev          # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL
npm run dev          # starts on http://localhost:3000
```

### 4. Verify

- Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
- Open [http://localhost:3000](http://localhost:3000) in your browser

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Required | Description                                  | Example                                       |
|-----------------|----------|----------------------------------------------|-----------------------------------------------|
| `PORT`          | No       | HTTP port (default: 5000)                    | `5000`                                        |
| `MONGODB_URI`   | **Yes**  | MongoDB connection string                    | `mongodb+srv://user:pass@cluster.mongodb.net/memed` |
| `JWT_SECRET`    | **Yes**  | Secret for signing JWTs                      | `some_long_random_string`                     |
| `JWT_EXPIRES_IN`| No       | JWT lifetime (default: `7d`)                 | `7d`                                          |
| `FRONTEND_URL`  | No       | Allowed CORS origin (default: localhost:3000)| `https://memed-frontend.vercel.app`           |

Optional backend setting: REDIS_URL defaults to redis://localhost:6379; the campaign cache falls back to in-memory storage if Redis is unavailable.

### Frontend (`frontend/.env.local`)

| Variable              | Required | Description                   | Example                               |
|-----------------------|----------|-------------------------------|---------------------------------------|
| `NEXT_PUBLIC_API_URL` | **Yes**  | Backend API base URL          | `https://memed-backend.onrender.com`  |

---

## API Reference

### Auth

| Method | Endpoint             | Auth | Body                              | Description           |
|--------|----------------------|------|-----------------------------------|-----------------------|
| POST   | `/api/auth/signup`   | —    | `{ name, email, password, role }` | Register new user     |
| POST   | `/api/auth/login`    | —    | `{ email, password }`             | Login, returns JWT    |

### Campaigns

| Method | Endpoint               | Auth         | Body / Notes                          |
|--------|------------------------|--------------|---------------------------------------|
| POST   | `/api/campaigns`       | Brand        | `{ name, platform, totalBudget, milestones }` |
| GET    | `/api/campaigns`       | —            | List all active campaigns             |
| GET    | `/api/campaigns/my`    | Brand        | Brand's own campaigns                 |
| GET    | `/api/campaigns/:id`   | Brand        | Single campaign with budget details   |

### Submissions

| Method | Endpoint                       | Auth    | Body / Notes                          |
|--------|--------------------------------|---------|---------------------------------------|
| POST   | `/api/submissions`             | Creator | `{ campaignId, postLink }`            |
| GET    | `/api/submissions/my`          | Creator | Creator's submissions + totalEarnings |
| PATCH  | `/api/submissions/:id/views`   | —       | `{ views: number }` — simulates platform data |

---

## Running Tests

```bash
cd backend
npm test
```

**18 unit tests across 3 suites**, plus 3 MongoDB replica-set integration tests (21 tests across 4 suites total):

- `payout.test.ts` and `budget.test.ts` cover milestone calculation and budget-cap arithmetic.
- `normalizePostLink.test.ts` covers platform URL normalization, tracking parameters, and invalid URLs.
- `payoutConcurrency.integration.test.ts` covers simultaneous updates to one submission, separate submissions competing for one budget, and rollback after a submission-write failure.

The integration suite starts a single-node replica set with `mongodb-memory-server`; its first run may download the MongoDB binary. MongoDB's driver retries transactions when it encounters errors labeled transient. If retries are exhausted or a write fails, the transaction aborts, so the campaign budget and submission payout are not partially committed. This guarantee applies when requests use this transaction path and MongoDB runs as a replica set or sharded cluster.
## Design Decisions & Assumptions

### 1. Payout = Highest Milestone Crossed (Not Additive)

> "A creator's payout is the amount of the highest milestone their post has crossed."

If milestones are `10K→₹500, 50K→₹2,000, 100K→₹5,000` and a post gets 60K views, payout = **₹2,000** (not ₹500 + ₹2,000 = ₹2,500). This is what the spec says.

### 2. One-Way Payout Ratchet (Views Can't Decrease Payout)

If a post was at 60K views (₹2,000 payout) and the API is called with 20K views, the payout stays at ₹2,000. Budget already allocated is not reversed. Rationale: view counts from platforms rarely go down (maybe due to spam removal), and reversing already-paid creator earnings is not practical.

### 3. Budget Cap at Remaining Budget (Not Full Rejection)

If the remaining campaign budget is ₹800 but a creator earns ₹2,000 in a view update, they receive ₹800 (the remaining amount). The campaign is not left with ₹0 rejected — they get whatever is left. The API response includes `capped: true` so the caller knows.

### 4. Atomic Budget and Payout Updates

The `PATCH /views` endpoint uses a MongoDB transaction to update the campaign budget and submission payout together. If either write fails, both are rolled back. MongoDB retries transient transaction conflicts, so simultaneous view updates cannot charge the same payout twice or exceed the campaign budget.

**Database requirement:** MongoDB transactions require a replica set or sharded cluster. MongoDB Atlas supports this; a standalone local MongoDB server does not. For local development, use a local replica set or an Atlas connection string.

### 5. Duplicate Post Submissions

A creator may submit multiple different posts to a campaign, but the same post cannot be submitted twice to the same campaign. Instagram tracking parameters and common YouTube URL variants are normalized before checking duplicates. A unique index provides an additional guard against concurrent duplicate submissions.
### 6. Milestones Sorted Ascending on Save

Milestone arrays are always sorted by `viewThreshold` ascending before being stored (via Mongoose pre-save hook) and before payout calculation, regardless of how they're submitted.

### 7. Campaign `status` Field

Campaigns default to `active`. We don't auto-complete them when the budget hits zero — instead the `budgetRemaining` virtual and `capped: true` in view-update responses communicate budget exhaustion. A brand can manually update status (future feature). This avoids a race where two near-simultaneous view updates both see budget > 0 but collectively exhaust it before either marks complete.

---

### 8. Backend Input Validation

Campaign names and post links must be non-empty strings. Budgets and payouts must be finite positive numbers, view thresholds must be positive safe integers, and view updates must be non-negative safe integers. These checks run on the backend regardless of frontend validation.

### 9. Submission Eligibility

Checking campaign status, confirming budget remains, and creating a submission happen in one MongoDB transaction. The transaction increments an internal submission counter on the campaign, which serializes submission creation with payout updates. If a payout exhausts the budget first, the submission transaction retries and rejects the submission.
## Stretch Goals Implemented

### ✅ Race Condition Prevention (Atomic Budget Updates)

See "Atomic Budget and Payout Updates" above. Implemented with a MongoDB transaction so budget and payout changes commit or roll back together.

### ✅ Idempotent View Updates (No Double-Pay)

Each `Submission` stores `currentPayout`. When views are updated, only the **delta** (new payout − current payout) is added to `budgetSpent`. Sending the same view count twice results in zero additional budget allocation.

---

## Scaling to 10,000 Creators

The current single-server design would face bottlenecks at scale. Here's how to address them:

### Hotspots

1. **`PATCH /submissions/:id/views`** — transactions on a popular campaign can contend on the `budgetSpent` field. At higher volume, queue payout allocations by campaign to control write contention.

2. **`GET /campaigns`** — read-heavy; campaigns list is queried by every creator on load.

### Strategies

| Layer | Strategy |
|-------|----------|
| **Caching** | Cache `GET /campaigns` response in Redis with a short TTL (30s–60s). Invalidate on campaign creation/update. This eliminates 95%+ of read DB load. |
| **Budget writes** | Replace retry loop with a **MongoDB change stream + queue** pattern: view updates are enqueued (SQS/BullMQ), a budget worker processes them serially per campaign. Guarantees ordering, eliminates spin-locks. |
| **Horizontal scaling** | Stateless Express API behind a load balancer (AWS ALB / GCP LB). MongoDB Atlas auto-scales horizontally. Redis for shared session/cache state. |
| **Read replicas** | Direct `GET` queries to MongoDB read replicas. Write operations go to primary only. |
| **Rate limiting** | `PATCH /views` per submission ID (e.g., max 1 update per submission per 60s) to avoid platform-webhook storms. Use Redis counters. |
| **Webhook design** | Rather than polling, Instagram/YouTube push webhooks to a queue (SQS). Workers consume and call the view update logic — decoupled from API request cycle, naturally rate-limited. |

### Spike Detection (Bonus)

Flag a submission when its views grow unusually fast by computing a velocity metric:

```
velocity = (newViews - oldViews) / timeSinceLastUpdate (in hours)
```

If velocity exceeds a threshold (e.g., 100K views/hour), set `submission.flagged = true`. This can be done in the PATCH handler without extra infrastructure.

---

## Git Commit Style

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new features
- `fix:` bug fixes
- `test:` test additions/changes
- `chore:` build/config changes
- `refactor:` code restructuring without behaviour change
