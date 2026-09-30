# SourcePay

Pay the source. Paste a YouTube video, Short, channel URL, or handle. SourcePay finds the channel and the supporter pays through Flutterwave. A verified channel is paid through its Flutterwave subaccount. An unclaimed channel gets a claim link: the creator verifies with Google, connects a Nigerian bank, and the collected payment is transferred. Unclaimed payments are refundable and auto refund after 14 days.

Next.js on Vercel, Supabase Postgres.

## Run locally

1. `pnpm install`
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and fill the credentials. `DATABASE_URL` is the Supabase transaction pooler string (port 6543). Use Flutterwave test keys.
4. Google OAuth redirect URI: `http://localhost:3000/api/auth/youtube/callback`. Enable YouTube Data API v3.
5. `pnpm dev`

Flutterwave webhooks need a public URL: `https://YOUR_DOMAIN/api/webhooks/flutterwave`, with the same secret hash as `FLUTTERWAVE_WEBHOOK_SECRET`.

## Deploy

Set every variable from `.env.example` in Vercel project settings, then push to `main`. `vercel.json` runs `/api/jobs/settlement` daily for payout retries, refund status, and 14 day refunds.

A payment counts as successful only after server-side Flutterwave verification. Keep `ENABLE_UNCLAIMED_PAYMENTS=false` in production until Flutterwave confirms transfers, refunds, and pay-before-claim collection for this account.

## Scope

YouTube, NGN, Nigerian banks, Flutterwave. Nomba and stablecoins are future adapters. No SourcePay wallet or signup.

Product rules are in `AGENTS.md`.
