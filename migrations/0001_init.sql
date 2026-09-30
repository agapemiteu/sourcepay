-- SourcePay schema for Cloudflare D1 (SQLite). IDs are UUIDs generated in code. Timestamps are ISO 8601 UTC text.

create table sources (
  id text primary key,
  platform text not null default 'YOUTUBE' check (platform = 'YOUTUBE'),
  platform_id text not null,
  current_handle text,
  display_name text not null,
  avatar_url text,
  verification_status text not null default 'UNCLAIMED' check (verification_status in ('UNCLAIMED', 'VERIFIED', 'SUSPENDED')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (platform, platform_id)
);

create table source_content (
  id text primary key,
  source_id text not null references sources(id),
  platform_content_id text not null,
  type text not null check (type in ('VIDEO', 'SHORT')),
  title text not null,
  thumbnail_url text,
  canonical_url text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (source_id, platform_content_id)
);

create table claims (
  id text primary key,
  source_id text not null references sources(id),
  token_hash text not null unique,
  status text not null default 'STARTED' check (status in ('STARTED', 'PLATFORM_VERIFIED', 'ACTIVE', 'FAILED')),
  verified_platform_id text,
  started_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  verified_at text,
  expires_at text not null
);

create table payout_routes (
  id text primary key,
  source_id text not null references sources(id),
  type text not null default 'NGN_BANK' check (type = 'NGN_BANK'),
  provider text not null default 'FLUTTERWAVE' check (provider = 'FLUTTERWAVE'),
  provider_destination_id text not null,
  provider_beneficiary_id integer,
  display_name text not null,
  account_last4 text not null,
  bank_name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create unique index one_active_route_per_source on payout_routes(source_id) where status = 'ACTIVE';

create table payments (
  id text primary key,
  source_id text not null references sources(id),
  source_content_id text references source_content(id),
  claim_id text references claims(id),
  supporter_email text not null,
  amount integer not null check (amount >= 10000),
  currency text not null default 'NGN' check (currency = 'NGN'),
  provider text not null default 'FLUTTERWAVE' check (provider = 'FLUTTERWAVE'),
  payout_destination_id text,
  provider_reference text not null unique,
  provider_transaction_id integer,
  amount_settled integer,
  settlement_status text not null default 'NONE' check (settlement_status in ('NONE', 'WAITING_CLAIM', 'READY', 'TRANSFER_REQUESTED', 'TRANSFER_PENDING', 'PAID', 'REFUND_REQUESTED', 'REFUND_PENDING', 'REFUNDED', 'NEEDS_REVIEW')),
  transfer_reference text unique,
  provider_transfer_id integer,
  transfer_requested_at text,
  refund_id integer,
  refund_requested_at text,
  status text not null default 'INITIALIZED' check (status in ('INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  paid_at text
);
create index payments_settlement_queue on payments(settlement_status, paid_at);
create index payments_claim on payments(claim_id);

create table audit_events (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  event text not null,
  metadata text not null default '{}',
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
