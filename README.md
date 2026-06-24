# FoodieGo Backend — Brand Owner Module

Node.js + Express backend for FoodieGo's Brand Owner module. JavaScript (CommonJS),
enterprise **layer-first** architecture, with persistence currently provided by an
**in-memory store** — a real Postgres database is **deferred** (see below).

This phase ships **auto-approve** (no Admin approval): a new brand is immediately
`approved` / `is_active`. The approval gate is kept behind a feature flag so it can
be turned on later with no schema or CRUD rewrite.

---

## Layer-first structure

Each technical concern is its own top-level directory; one file per domain inside.

```
src/
├─ app.js                 # express app + global middleware (no listen)
├─ server.js              # http bootstrap (reads PORT, optional seed-on-boot)
├─ config/                # env loader, in-memory store, constants/enums
├─ routes/                # ROUTING LAYER — declare endpoints + attach middleware
├─ controllers/           # CONTROLLER LAYER (thin) — parse req, call service, respond
├─ services/              # SERVICE LAYER — all business logic
├─ repositories/          # DATA-ACCESS LAYER — the only consumers of the store
├─ models/                # DOMAIN MODEL FACTORIES — plain objects + defaults
├─ validators/            # INPUT VALIDATION — Joi schemas
├─ middlewares/           # jwtVerify, roleCheck, scopeCheck, validate, errorHandler
├─ utils/                 # audit, logger, tokens, sms, adminQueue, csv, errors
└─ db/
   ├─ migrations/         # raw Postgres DDL for LATER (NOT executed now)
   └─ seeds/              # in-memory seed + equivalent SQL seed
tests/
├─ integration/           # full route tests (Jest + Supertest) + helpers.js
└─ unit/                  # services/repositories in isolation
```

**Strictly one-directional layering:**

```
routes → middlewares → controllers → services → repositories → store
                                          ↓
                              validators / models / utils
```

- **routes** — declare endpoints + attach middleware; no logic.
- **controllers** — parse request, call a service, shape response, `catch -> next`. No data access.
- **services** — all business logic (auto-approve, menu lock, scope rules).
- **repositories** — the only place that touches the store.
- **models / validators / utils** — supporting concerns reused across layers.

Every **mutating** endpoint writes an `audit_log` entry via `utils/audit.log(...)`.

---

## Database is deferred (in-memory store)

Persistence lives entirely in `src/config/database.js` as an in-memory `store` of
`Map`s plus an append-only `auditLogs` array. **Repositories are the only consumers
of the store**, so a real Postgres pool can be swapped in with zero changes to
services/controllers.

The app and the test suite run with **no database**.

### Wiring up Postgres later

1. The real DDL already lives in `src/db/migrations/*.sql`
   (`01_users.sql` … `09_mv_brand_report.sql`). Run them top-down against a fresh DB.
2. Turn `src/config/database.js` into a `pg.Pool` singleton (a `// SWAP-TO-PG SEAM`
   comment at the top of that file shows exactly how).
3. Re-implement each repository method to run SQL via `pool.query(...)` instead of
   `Map` operations. The repository method signatures (all `async`) stay identical,
   so nothing above the repository layer changes.
4. Seed via `src/db/seeds/seed.sql` (the SQL equivalent of the in-memory seed).

---

## Getting started

```bash
npm install      # orchestrator installs deps
npm start        # node src/server.js  (seeds demo data when SEED_ON_BOOT=true)
npm run dev      # nodemon
npm test         # cross-env NODE_ENV=test jest --runInBand
npm run lint     # eslint src tests
```

Configuration is 12-factor via `.env` (copy from `.env.example`). No secrets in code.

---

## Seeded demo credentials

Seeded on boot (when `SEED_ON_BOOT=true`) and by tests via `resetStore()`.
Password for all: **`Password123!`**

| Role                | Email                  | Id                                     |
|---------------------|------------------------|----------------------------------------|
| BRAND_OWNER         | `owner1@foodiego.test` | `11111111-1111-1111-1111-111111111111` |
| BRAND_OWNER         | `owner2@foodiego.test` | `22222222-2222-2222-2222-222222222222` |
| RESTAURANT_MANAGER  | `staff1@foodiego.test` | `33333333-3333-3333-3333-333333333333` |

---

## Auto-approve flag

`REQUIRE_ADMIN_APPROVAL=false` (this phase): new brands are created `approved` /
`is_active=true` and are immediately usable; `adminQueue.notify` is a no-op stub.

Flip `REQUIRE_ADMIN_APPROVAL=true` later and new brands become `pending` and are
queued to the Admin service via `adminQueue.notify` — **no schema or CRUD change
required**. The downstream gate (`status === 'approved' && is_active`) is already in
place and simply never trips while auto-approve is on.

---

## API surface (all under `/api`)

`GET /api/health` is public. Everything else requires `jwtVerify`; the brand-owner
endpoints also require `roleCheck([BRAND_OWNER])` (payouts also allow `ADMIN`).
JSON in/out; errors are `{ error, details? }`.

- **Auth:** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Brands:** `POST /brands`, `GET /brands`, `GET/PATCH/DELETE /brands/:id`
- **Restaurants:** `POST /restaurants`, `GET /restaurants?brandId=`
- **Branches:** `POST /branches`, `GET /branches?restaurantId=`
- **Staff:** `POST /restaurant-users`, `DELETE /restaurant-users/:id`, `GET /restaurant-users?brandId=`
- **Menu:** `POST /brands/:id/menu-submission`, `POST /menu-change-requests`, `GET /menu-change-requests?brandId=`
- **Reports:** `GET /brands/:id/reports?from=&to=`, `GET /brands/:id/payouts?format=csv`

Scope is enforced by `scopeCheck(key)`: an owner may only ever touch their own brand.
On a mismatch the request gets **403** and a `SCOPE_DENIED` row is written to the audit log.
