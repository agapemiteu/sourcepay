# SourcePay

**Pay the source.**

Paste anything online that gave you value, and pay the person behind it. No bank details. No signup.

Live: https://sourcepay-flax.vercel.app

## How it works

1. **Paste** a link or handle.
2. **Resolve.** SourcePay finds the real account behind it.
3. **Pay** through Flutterwave checkout.
4. **Verify.** The creator signs in with the platform to prove the account is theirs.
5. **Route.** The creator connects a bank and the payment reaches them.

If a creator never claims a payment, the supporter can get a refund.

YouTube is the first platform, with payouts to Nigerian banks in naira.

## Built with

Next.js, Supabase, Flutterwave, YouTube Data API, Google OAuth, Vercel.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # add your own keys
pnpm dev
```

Create the database tables with `supabase/schema.sql`.
