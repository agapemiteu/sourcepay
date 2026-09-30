create extension if not exists pgcrypto;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'YOUTUBE' check (platform = 'YOUTUBE'),
  platform_id text not null,
  current_handle text,
  display_name text not null,
  avatar_url text,
  verification_status text not null default 'UNCLAIMED' check (verification_status in ('UNCLAIMED', 'VERIFIED', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_id)
);

create table if not exists source_content (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  platform_content_id text not null,
  type text not null check (type in ('VIDEO', 'SHORT')),
  title text not null,
  thumbnail_url text,
  canonical_url text not null,
  created_at timestamptz not null default now(),
  unique (source_id, platform_content_id)
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  token_hash text not null unique,
  status text not null default 'STARTED' check (status in ('STARTED', 'PLATFORM_VERIFIED', 'ACTIVE', 'FAILED')),
  verified_platform_id text,
  started_at timestamptz not null default now(),
  verified_at timestamptz,
  expires_at timestamptz not null
);

create table if not exists payout_routes (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  type text not null default 'NGN_BANK' check (type = 'NGN_BANK'),
  provider text not null default 'FLUTTERWAVE' check (provider in ('PAYSTACK', 'FLUTTERWAVE')),
  provider_destination_id text not null,
  provider_beneficiary_id bigint,
  display_name text not null,
  account_last4 text not null,
  bank_name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists one_active_route_per_source on payout_routes(source_id) where status = 'ACTIVE';

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  source_content_id uuid references source_content(id),
  claim_id uuid references claims(id),
  supporter_email text not null,
  amount integer not null check (amount >= 10000),
  currency text not null default 'NGN' check (currency = 'NGN'),
  provider text not null default 'FLUTTERWAVE' check (provider in ('PAYSTACK', 'FLUTTERWAVE')),
  payout_destination_id text,
  provider_reference text not null unique,
  provider_transaction_id bigint,
  amount_settled integer,
  settlement_status text not null default 'NONE' check (settlement_status in ('NONE', 'WAITING_CLAIM', 'READY', 'TRANSFER_REQUESTED', 'TRANSFER_PENDING', 'PAID', 'REFUND_REQUESTED', 'REFUND_PENDING', 'REFUNDED', 'NEEDS_REVIEW')),
  transfer_reference text unique,
  provider_transfer_id bigint,
  transfer_requested_at timestamptz,
  refund_id bigint,
  refund_requested_at timestamptz,
  status text not null default 'INITIALIZED' check (status in ('INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_settlement_queue on payments(settlement_status, paid_at);
create index if not exists payments_claim on payments(claim_id);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table sources enable row level security;
alter table source_content enable row level security;
alter table claims enable row level security;
alter table payout_routes enable row level security;
alter table payments enable row level security;
alter table audit_events enable row level security;

-- No browser access. The server connects with DATABASE_URL and enforces access.
