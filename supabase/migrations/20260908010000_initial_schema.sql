-- CuentaClarita: esquema actual de months, debts y RPCs
-- Generado desde el esquema actual de Supabase.

create table if not exists public.months (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null,
  salary numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint months_month_check check (month between 1 and 12),
  constraint months_salary_check check (salary >= 0),
  constraint months_status_check check (status in ('active', 'finished'))
);

create table if not exists public.debts (
  id text primary key,
  month_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  due_date text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_amount_check check (amount >= 0),
  constraint debts_month_id_fkey
    foreign key (month_id)
    references public.months(id)
    on delete cascade
);

alter table public.months enable row level security;
alter table public.debts enable row level security;

create policy "months_select_own"
on public.months for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "months_insert_own"
on public.months for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "months_update_own"
on public.months for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "months_delete_own"
on public.months for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "debts_select_own"
on public.debts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "debts_insert_own"
on public.debts for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.months m
    where m.id = debts.month_id
      and m.user_id = (select auth.uid())
  )
);

create policy "debts_update_own"
on public.debts for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.months m
    where m.id = debts.month_id
      and m.user_id = (select auth.uid())
  )
);

create policy "debts_delete_own"
on public.debts for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.create_month_with_debts(
  p_month_id text,
  p_year integer,
  p_month integer,
  p_salary numeric,
  p_debts jsonb default '[]'::jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.months
  set status = 'finished',
      updated_at = now()
  where user_id = auth.uid()
    and status = 'active';

  insert into public.months (
    id, user_id, year, month, salary, status, created_at, updated_at
  )
  values (
    p_month_id, auth.uid(), p_year, p_month, p_salary,
    'active', now(), now()
  );

  insert into public.debts (
    id, month_id, user_id, name, amount,
    due_date, notes, created_at, updated_at
  )
  select
    debt->>'id',
    p_month_id,
    auth.uid(),
    debt->>'name',
    (debt->>'amount')::numeric,
    debt->>'due_date',
    debt->>'notes',
    coalesce((debt->>'created_at')::timestamptz, now()),
    coalesce((debt->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(p_debts) as debt;
end;
$$;

create or replace function public.delete_month_with_debts(
  p_month_id text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.debts
  where month_id = p_month_id
    and user_id = auth.uid();

  delete from public.months
  where id = p_month_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.create_month_with_debts(text, integer, integer, numeric, jsonb)
from public, anon;

revoke all on function public.delete_month_with_debts(text)
from public, anon;

grant execute on function public.create_month_with_debts(text, integer, integer, numeric, jsonb)
to authenticated;

grant execute on function public.delete_month_with_debts(text)
to authenticated;
