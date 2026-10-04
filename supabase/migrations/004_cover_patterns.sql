-- =====================================================================
-- Vrinzu: journal cover patterns
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run. Only adds a column; existing journals keep a plain cover.
-- =====================================================================

alter table public.journals add column if not exists cover_pattern text not null default 'plain';

alter table public.journals drop constraint if exists journals_cover_pattern_check;
alter table public.journals add constraint journals_cover_pattern_check
  check (cover_pattern in ('plain', 'waves', 'dots', 'stripes', 'grid', 'sunrise'));
