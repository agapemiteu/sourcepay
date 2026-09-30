-- Run once in an existing SourcePay database before using Flutterwave.
alter table payout_routes alter column provider set default 'FLUTTERWAVE';
alter table payout_routes drop constraint if exists payout_routes_provider_check;
alter table payout_routes add constraint payout_routes_provider_check check (provider in ('PAYSTACK', 'FLUTTERWAVE'));

alter table payments alter column provider set default 'FLUTTERWAVE';
alter table payments drop constraint if exists payments_provider_check;
alter table payments add constraint payments_provider_check check (provider in ('PAYSTACK', 'FLUTTERWAVE'));
