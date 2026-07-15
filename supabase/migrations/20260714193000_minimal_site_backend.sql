create extension if not exists pgcrypto;

create table public.app_settings (
  key text primary key check (key = 'admin_email'),
  value text not null check (length(trim(value)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id bigint generated always as identity primary key,
  registration_number text unique,
  parent_name text not null check (length(trim(parent_name)) > 0),
  email text not null check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  phone text not null check (length(trim(phone)) > 0),
  address text not null check (length(trim(address)) > 0),
  student_name text not null check (length(trim(student_name)) > 0),
  chinese_name text,
  age integer not null check (age between 3 and 99),
  grade text not null check (length(trim(grade)) > 0),
  program text not null check (length(trim(program)) > 0),
  class_preference text not null check (length(trim(class_preference)) > 0),
  notes text,
  payment_method text not null check (payment_method in ('zelle', 'check')),
  early_bird boolean not null default false,
  terms_accepted boolean not null check (terms_accepted = true),
  registration_status text not null default 'submitted' check (
    registration_status in ('submitted', 'under_review', 'approved', 'rejected', 'archived')
  ),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'pending', 'paid', 'waived', 'refunded')
  ),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_events (
  id bigint generated always as identity primary key,
  title text not null check (length(trim(title)) > 0),
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  category text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_time_check check (end_at is null or end_at >= start_at)
);

insert into public.app_settings (key, value)
values ('admin_email', 'admin@gmail.com')
on conflict (key) do nothing;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower(
    coalesce(
      (
        select value
        from public.app_settings
        where key = 'admin_email'
      ),
      ''
    )
  );
$$;

create function public.submit_registration(
  p_parent_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_student_name text,
  p_chinese_name text default null,
  p_age integer default null,
  p_grade text default null,
  p_program text default null,
  p_class_preference text default null,
  p_notes text default null,
  p_payment_method text default null,
  p_early_bird boolean default false,
  p_terms_accepted boolean default false
)
returns table (
  registration_number text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id bigint;
  new_submitted_at timestamptz;
  new_registration_number text;
begin
  if coalesce(trim(p_parent_name), '') = '' then
    raise exception 'Parent name is required.';
  end if;

  if coalesce(trim(p_email), '') = '' then
    raise exception 'Email is required.';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Phone is required.';
  end if;

  if coalesce(trim(p_address), '') = '' then
    raise exception 'Address is required.';
  end if;

  if coalesce(trim(p_student_name), '') = '' then
    raise exception 'Student name is required.';
  end if;

  if p_age is null or p_age < 3 or p_age > 99 then
    raise exception 'Age must be between 3 and 99.';
  end if;

  if coalesce(trim(p_grade), '') = '' then
    raise exception 'Grade is required.';
  end if;

  if coalesce(trim(p_program), '') = '' then
    raise exception 'Program is required.';
  end if;

  if coalesce(trim(p_class_preference), '') = '' then
    raise exception 'Class preference is required.';
  end if;

  if p_payment_method not in ('zelle', 'check') then
    raise exception 'Payment method must be zelle or check.';
  end if;

  if p_terms_accepted is distinct from true then
    raise exception 'Terms must be accepted.';
  end if;

  insert into public.registrations (
    parent_name,
    email,
    phone,
    address,
    student_name,
    chinese_name,
    age,
    grade,
    program,
    class_preference,
    notes,
    payment_method,
    early_bird,
    terms_accepted
  )
  values (
    trim(p_parent_name),
    lower(trim(p_email)),
    trim(p_phone),
    trim(p_address),
    trim(p_student_name),
    nullif(trim(coalesce(p_chinese_name, '')), ''),
    p_age,
    trim(p_grade),
    trim(p_program),
    trim(p_class_preference),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_payment_method,
    coalesce(p_early_bird, false),
    true
  )
  returning registrations.id
  into new_id;

  select registrations.submitted_at
  into new_submitted_at
  from public.registrations
  where registrations.id = new_id;

  new_registration_number := format(
    'LCS-%s-%05s',
    to_char(timezone('America/New_York', new_submitted_at), 'YYYY'),
    new_id
  );

  update public.registrations
  set registration_number = new_registration_number
  where id = new_id;

  return query
  select new_registration_number as registration_number, new_submitted_at as submitted_at;
end;
$$;

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

create trigger registrations_set_updated_at
before update on public.registrations
for each row
execute function public.set_updated_at();

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row
execute function public.set_updated_at();

create index registrations_submitted_at_idx
on public.registrations (submitted_at desc);

create index calendar_events_published_start_at_idx
on public.calendar_events (published, start_at);

alter table public.app_settings enable row level security;
alter table public.registrations enable row level security;
alter table public.calendar_events enable row level security;

create policy app_settings_admin_all
on public.app_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy registrations_admin_all
on public.registrations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy calendar_events_public_read_published
on public.calendar_events
for select
to anon, authenticated
using (published = true or public.is_admin());

create policy calendar_events_admin_write
on public.calendar_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant execute on function public.submit_registration(
  text, text, text, text, text, text, integer, text, text, text, text, text, boolean, boolean
) to anon, authenticated;
