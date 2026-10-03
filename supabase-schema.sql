-- =====================================================================
-- Vrinzu — Supabase schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query
-- It is safe to re-run (it uses IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.journals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  cover_color text not null default '#0284c7',
  cover_emoji text not null default '📔',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  journal_id  uuid not null references public.journals (id) on delete cascade,
  title       text not null default '',
  content     text not null default '',
  mood        text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists journals_user_id_idx     on public.journals (user_id, updated_at desc);
create index if not exists entries_user_id_idx      on public.entries  (user_id, created_at desc);
create index if not exists entries_journal_id_idx   on public.entries  (journal_id, created_at desc);

-- ---------------------------------------------------------------------
-- updated_at trigger (shared by both tables)
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journals_set_updated_at on public.journals;
create trigger journals_set_updated_at
  before update on public.journals
  for each row execute function public.set_updated_at();

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security — every user only ever sees their own rows
-- ---------------------------------------------------------------------

alter table public.journals enable row level security;
alter table public.entries  enable row level security;

-- journals
drop policy if exists "Users can view their own journals"   on public.journals;
drop policy if exists "Users can create their own journals" on public.journals;
drop policy if exists "Users can update their own journals" on public.journals;
drop policy if exists "Users can delete their own journals" on public.journals;

create policy "Users can view their own journals"
  on public.journals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own journals"
  on public.journals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own journals"
  on public.journals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own journals"
  on public.journals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- entries (writes also require the target journal to belong to the user)
drop policy if exists "Users can view their own entries"   on public.entries;
drop policy if exists "Users can create their own entries" on public.entries;
drop policy if exists "Users can update their own entries" on public.entries;
drop policy if exists "Users can delete their own entries" on public.entries;

create policy "Users can view their own entries"
  on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own entries"
  on public.entries for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.journals j
      where j.id = journal_id and j.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own entries"
  on public.entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.journals j
      where j.id = journal_id and j.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own entries"
  on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- Photos in entries (Supabase Storage)
-- ---------------------------------------------------------------------

alter table public.entries add column if not exists photos text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entry-photos', 'entry-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own entry photos"   on storage.objects;
drop policy if exists "Users can upload their own entry photos" on storage.objects;
drop policy if exists "Users can update their own entry photos" on storage.objects;
drop policy if exists "Users can delete their own entry photos" on storage.objects;

create policy "Users can view their own entry photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their own entry photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update their own entry photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own entry photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- Page styles, fonts, journal locks and text formatting
-- ---------------------------------------------------------------------
-- Per-journal writing font and page style
alter table public.journals add column if not exists font  text not null default 'sans';
alter table public.journals add column if not exists paper text not null default 'plain';

alter table public.journals drop constraint if exists journals_font_check;
alter table public.journals add constraint journals_font_check
  check (font in ('sans', 'serif', 'hand', 'typewriter'));

alter table public.journals drop constraint if exists journals_paper_check;
alter table public.journals add constraint journals_paper_check
  check (paper in ('plain', 'lined', 'warm', 'dotted'));

-- Journals that ask for the passcode before they open
alter table public.journals add column if not exists is_locked boolean not null default false;

-- Formatted entry text (bold, italic, lists, links). `content` keeps the
-- plain-text version for previews, search and .txt export.
alter table public.entries add column if not exists content_html text;
