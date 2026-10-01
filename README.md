# SourcePay

**Pay the source.**

Live: https://sourcepay-flax.vercel.app

## What is SourcePay?

SourcePay makes any public internet identity payable.

Every day people get value from creators online: a video, a post, a tutorial. But paying them back means asking for a bank account, a payment link, or an app they may not use. So most creators never get paid by the people they help.

With SourcePay, you paste the thing that gave you value and pay the person behind it. You never need their bank details, and they don't need an account first. If they are new, they get a claim link, prove the identity is theirs, and receive the payment.

Value should travel back to its source.

## Who we are building for

Independent creators, journalists, educators and indie professionals across Africa. Their work reaches people every day, but getting paid for it is still hard.

- **Most creators earn very little.** About 6 in 10 African creators earn less than $100 a month from their work, and ad revenue makes up only 5.8% of their income. ([Africa Creator Economy Report 2026](https://techpoint.africa/news/africa-creator-economy-report-2026/))
- **Many people are still outside the financial system.** In Sub-Saharan Africa, account ownership reached 58% of adults in 2024, which still leaves about 4 in 10 without one. Worldwide, 1.3 billion adults remain unbanked. ([World Bank Global Findex 2025](https://www.biia.com/financial-inclusion-at-record-high-but-1-3-billion-still-unbanked-world-bank-global-findex-2025-report))
- **Independent journalism struggles to fund itself.** Funding is the biggest challenge for independent media startups in the Global South. ([IJNet](https://ijnet.org/en/story/funding-greatest-challenge-media-startups-global-south-report-finds))

SourcePay lets their audience pay them directly, from the work itself, so more of the value they create comes back to them.

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
