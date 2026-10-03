-- =====================================================================
-- Vrinzu: page styles, fonts, journal locks and text formatting
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run. Only adds columns; existing data is untouched.
-- =====================================================================

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
