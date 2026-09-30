# SourcePay

Pay the source. Paste a YouTube video, Short, channel URL, or handle. SourcePay finds the channel and the supporter pays through Flutterwave. A verified channel is paid through its Flutterwave subaccount. An unclaimed channel gets a claim link: the creator verifies with Google, connects a Nigerian bank, and the collected payment is transferred. Unclaimed payments are refundable and auto refund after 14 days.

Runs on Cloudflare Workers (OpenNext) with a D1 database.

## Run locally

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill the credentials. Use Flutterwave test keys.
3. `pnpm db:migrate:local` creates the local D1 database from `migrations/`.
4. Google OAuth redirect URI: `http://localhost:3000/api/auth/youtube/callback`. Enable YouTube Data API v3.
5. `pnpm dev`

Flutterwave webhooks need a public URL. Point the test webhook at `https://YOUR_HOST/api/webhooks/flutterwave` with the same secret hash as `FLUTTERWAVE_WEBHOOK_SECRET`.

## Deploy

1. `npx wrangler login`
2. `npx wrangler d1 create sourcepay` and put the returned `database_id` in `wrangler.jsonc`.
3. `pnpm db:migrate:remote`
4. Set secrets with `npx wrangler secret put NAME` for every value in `.env.example` except `ENABLE_UNCLAIMED_PAYMENTS`, which is a var in `wrangler.jsonc`.
5. `pnpm deploy`

A daily cron in `wrangler.jsonc` runs `/api/jobs/settlement` for payout retries, refund status, and 14 day refunds.

A payment counts as successful only after server-side Flutterwave verification. Keep `ENABLE_UNCLAIMED_PAYMENTS=false` in production until Flutterwave confirms transfers, refunds, and pay-before-claim collection for this account.

## Scope

YouTube, NGN, Nigerian banks, Flutterwave. Nomba and stablecoins are future adapters. No SourcePay wallet or signup.

Product rules are in `AGENTS.md`.
