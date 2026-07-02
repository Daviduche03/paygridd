# PayGrid API (Express + tRPC + Drizzle)

TypeScript Express backend with tRPC for the dashboard and Express routes for OAuth and webhooks.

## Architecture

```
src/
├── app.ts                 # Express app (health, auth, webhooks, tRPC)
├── config/                # env, database
├── db/                    # Drizzle schema + migrations
├── controllers/           # HTTP handlers (webhooks)
├── middleware/            # auth, error, validation
├── routes/                # auth + webhooks only
├── services/
│   └── nomba/             # Nomba API, provider, webhooks
├── repositories/          # data access (Drizzle)
├── trpc/
│   ├── init.ts            # procedures + stub helpers
│   ├── router.ts          # root router
│   └── routers/           # domain routers
└── types/
```

## Tech

- Express 4
- tRPC + SuperJSON
- TypeScript (ESM)
- Drizzle ORM (Postgres)
- Zod for validation + env

## Running

```bash
bun install
bun run dev
```

Server runs on http://127.0.0.1:3003

## Endpoints

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness check |
| `GET /auth/google` | Start Google OAuth |
| `GET /auth/google/callback` | OAuth callback |
| `POST /webhooks/nomba` | Nomba payment/payout webhooks |
| `/trpc/*` | All dashboard API (tRPC) |

## Nomba webhooks

1. Set `NOMBA_WEBHOOK_SECRET` to the signature key from the Nomba dashboard.
2. Register webhook URL: `https://your-domain.com/webhooks/nomba`
3. Nomba sends `nomba-signature`, `nomba-timestamp`, and `nomba-signature-algorithm` headers.
4. Signature is HMAC-SHA256 over:

   `event_type:requestId:userId:walletId:transactionId:transactionType:transactionTime:responseCode:nomba-timestamp`

5. Verified events are stored in memory and exposed via `transactions.list` tRPC.

For local testing, expose the API with ngrok and point Nomba sandbox webhooks at your tunnel URL.

## Environment

Copy `.env.example` → `.env` and fill values.

Database schema lives in `src/db/schema.ts`. Migrations are in `migrations/`.

**Fresh database required:** PayGrid uses a lean schema (teams, users, virtual_accounts, transactions, etc.). Drop or recreate your dev database before running migrations:

```bash
bun run db:migrate
```

Or push schema directly during development:

```bash
bun run db:push
```
