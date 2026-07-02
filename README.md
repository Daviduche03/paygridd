<p align="center">
  <h1 align="center"><b>PayGrid</b></h1>
</p>

<p align="center">
  A programmable accounts receivable platform built on Nomba's Dedicated Virtual Accounts infrastructure.
</p>

## The Problem

Businesses receive bank transfers every day, but they still have to manually answer questions like:

- Who sent this payment?
- Which invoice is it for?
- Was the full amount paid?
- Was it an overpayment?
- Should we notify the customer?
- Should this trigger another workflow?

**PayGrid automates that entire process.**

## What It Does

- **Dedicated Virtual Accounts** — Every customer gets a unique account number at creation. Payments are automatically matched to the right customer and invoice without manual reconciliation.
- **Transaction Monitoring** — Real-time view of all incoming payments with automated matching, status tracking, and discrepancy detection.
- **KYC Tier Management** — Built-in tiered KYC system (Tier 1–3) with configurable daily/monthly limits, BVN verification, ID document uploads, and automatic tier upgrades.
- **Webhook Automation** — Incoming payments trigger webhooks so you can connect downstream workflows (notify customers, update inventory, sync accounting, etc.).
- **Multi-Business** — Switch between businesses from the dashboard. Each business has isolated virtual accounts, transactions, customers, and settings.

## Tech Stack

- **Monorepo** — Bun, Turborepo
- **Frontend** — React, Vite, TailwindCSS, Shadcn
- **Backend** — Express, tRPC, Drizzle ORM, Postgres
- **Auth** — Google OAuth + JWT
- **Payments** — Nomba API (virtual accounts, webhooks)

## Getting Started

```bash
bun install
bun run dev
```

Frontend runs on `http://localhost:5173`, API on `http://localhost:3003`.
