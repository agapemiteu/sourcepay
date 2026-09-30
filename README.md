# SourcePay

Pay the source. Paste a YouTube video, Short, channel URL, or handle. SourcePay finds the channel, lets supporters pledge before a claim, and routes payment to a verified channel's Nigerian bank through Flutterwave.

## Run locally

1. Run `pnpm install`.
2. Run `supabase/schema.sql` in a new Supabase project. For an existing SourcePay database, run `supabase/migrate_flutterwave.sql` instead.
3. Copy `.env.example` to `.env.local` and fill the credentials.
4. Set the Google OAuth redirect URI to `http://localhost:3000/api/auth/youtube/callback` and enable YouTube Data API v3.
5. Set Flutterwave's webhook URL to `https://YOUR_DOMAIN/api/webhooks/flutterwave`. Use the same secret hash in Flutterwave and `FLUTTERWAVE_WEBHOOK_SECRET`.
6. Run `pnpm dev`.

The service role key and all provider secrets stay on the server. Use test keys and a channel you control for the first full loop. Flutterwave's test mode can resolve test bank accounts only. Confirm that live split payments and bank settlement are enabled before taking real payments. Pledges move no money. A payment is successful only after server-side Flutterwave verification.

Optional pledge reminders use Resend. Set `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` to send an email when a source becomes payable. Without them, the supporter can still revisit the pledge link.

## Scope

The MVP supports YouTube, NGN, Nigerian bank subaccounts, and Flutterwave. Nomba and stablecoins are future adapters. There is no SourcePay wallet or traditional signup.

The product rules and standing project instructions are in `AGENTS.md`. Gbrain context: `projects/sourcepay`.
