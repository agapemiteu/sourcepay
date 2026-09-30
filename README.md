# SourcePay

**Pay the source.**

Live: https://sourcepay-flax.vercel.app

## What is SourcePay?

SourcePay makes any public internet identity payable.

Every day people get value from creators online: a video, a post, a tutorial. But paying them back means asking for a bank account, a payment link, or an app they may not use. So most creators never get paid by the people they help.

With SourcePay, you paste the thing that gave you value and pay the person behind it. You never need their bank details, and they don't need an account first. If they are new, they get a claim link, prove the identity is theirs, and receive the payment.

Value should travel back to its source.

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
