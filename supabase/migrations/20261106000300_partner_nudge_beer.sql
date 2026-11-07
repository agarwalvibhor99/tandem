begin;

alter table public.partner_nudges
  drop constraint if exists partner_nudges_type_check;

alter table public.partner_nudges
  add constraint partner_nudges_type_check
  check (type in ('rose', 'heart', 'coffee', 'beer'));

commit;
