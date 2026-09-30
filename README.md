# SourcePay

Pay the source. Paste a YouTube video, Short, channel URL, or handle. SourcePay finds the channel, lets supporters pledge before a claim, and routes payment to a verified channel's Nigerian bank through Paystack.

## Run locally

1. Run `pnpm install`.
2. Run the SQL in `supabase/schema.sql` in a Supabase project.
3. Copy `.env.example` to `.env.local` and fill the credentials.
4. Set the Google OAuth redirect URI to `http://localhost:3000/api/auth/youtube/callback` and enable YouTube Data API v3.
5. Set Paystack's webhook URL to `https://YOUR_DOMAIN/api/webhooks/paystack`.
6. Run `pnpm dev`.

The service role key and all provider secrets stay on the server. Use test keys and a channel you control for the first full loop. Pledges move no money. A payment is successful only after server-side Paystack verification.

Optional pledge reminders use Resend. Set `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` to send an email when a source becomes payable. Without them, the supporter can still revisit the pledge link.

## Scope

The MVP supports YouTube, NGN, Nigerian bank subaccounts, and Paystack. Nomba and stablecoins are future adapters. There is no SourcePay wallet or traditional signup.

The product rules and standing project instructions are in `AGENTS.md`. Gbrain context: `projects/sourcepay`.
