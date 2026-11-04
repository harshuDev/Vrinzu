# Vrinzu

A private, beautiful online journal — a Penzu-style journaling app with an Ocean Blue theme.
Built with React (Create React App), Supabase (auth + Postgres with Row Level Security) and deployable to Vercel as an installable PWA.

## Features

- **Landing page** — sticky nav, animated gradient-blob hero, 6 feature cards, privacy section, CTA, footer
- **Auth** — email/password sign up (with name) and sign in, password show/hide, toast errors
- **Journals** — coloured covers with emoji, create / edit / delete (with confirmation)
- **Entries** — mood, title, 2-line preview, date and tags on each card
- **Editor** — Playfair Display title, full-page writing area, autosave 1.5 s after you stop typing (Ctrl/⌘+S saves instantly), mood picker, tags (Enter to add, × to remove), delete
- **Search** — searches titles and content across all journals, with highlighted previews
- **Photos** — attach photos to any entry (stored privately in Supabase Storage, auto-resized), full-screen viewer
- **Calendar** — month view with a mood marker on every day you wrote; tap a day to read it or write a back-dated entry
- **Export** — download any journal (or all of them) as a PDF document or a plain-text file
- **Dark mode** — System / Light / Dark, saved to your account so it follows you to every device
- **Passcode lock** — optional 4–6 digit passcode on open and after a minute in the background (stored only as a salted hash on your account)
- **Settings** — appearance, passcode, export, display name, password, sign out
- **Mobile & PWA** — bottom tab bar on phones, 44 px touch targets, installable on iOS / Android

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase URL + anon key
npm start
```

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql) and run it.
   (Existing projects created before photos were added: run [`supabase/migrations/002_entry_photos.sql`](./supabase/migrations/002_entry_photos.sql) instead.)
3. Copy the project URL and anon key from **Project Settings → API** into `.env.local`.

## Project structure

```
public/            index.html (PWA meta), manifest.json, service-worker.js, icons
src/
  App.js           routes
  index.js         providers + service-worker registration
  lib/             supabase client, constants (emojis, colours, moods), API helpers
  context/         AuthContext (session, sign in/up/out, profile updates)
  components/      layout, modals, cards, covers, route guards
  pages/           Landing, Login, Signup, Home, Journals, JournalDetail, EntryEditor, Search, Settings
  styles/          index.css (design tokens), landing.css, auth.css, app.css
supabase-schema.sql  full current schema (fresh projects)
supabase/migrations/ 001 initial schema, 002 photos, 003 styles/locks, 004 cover patterns (apply in order)
vercel.json        SPA rewrites for client-side routing
```

## Deploy

Import the repo in Vercel (framework preset: **Create React App**), add `REACT_APP_SUPABASE_URL` and
`REACT_APP_SUPABASE_ANON_KEY` under **Settings → Environment Variables**, and deploy. In Supabase,
set **Authentication → URL Configuration → Site URL** to your Vercel URL.
