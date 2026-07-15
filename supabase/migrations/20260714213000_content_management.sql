create table public.announcements (
  id bigint generated always as identity primary key,
  title text not null check (length(trim(title)) > 0),
  message text not null check (length(trim(message)) > 0),
  link text,
  published boolean not null default false,
  archived boolean not null default false,
  priority boolean not null default false,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_time_check check (
    expires_at is null or starts_at is null or expires_at >= starts_at
  )
);

create table public.news_posts (
  id bigint generated always as identity primary key,
  title text not null check (length(trim(title)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  body text not null check (length(trim(body)) > 0),
  image_url text,
  external_link text,
  published boolean not null default false,
  archived boolean not null default false,
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

create trigger news_posts_set_updated_at
before update on public.news_posts
for each row
execute function public.set_updated_at();

create index announcements_public_idx
on public.announcements (priority desc, created_at desc)
where published = true and archived = false;

create index news_posts_public_idx
on public.news_posts (featured desc, published_at desc, created_at desc)
where published = true and archived = false;

alter table public.announcements enable row level security;
alter table public.news_posts enable row level security;

create policy announcements_public_read
on public.announcements
for select
to anon, authenticated
using ((published = true and archived = false) or public.is_admin());

create policy announcements_admin_write
on public.announcements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy news_posts_public_read
on public.news_posts
for select
to anon, authenticated
using ((published = true and archived = false) or public.is_admin());

create policy news_posts_admin_write
on public.news_posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
