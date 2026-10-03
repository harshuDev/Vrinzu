# 🌊 Vrinzu

A private, beautiful online journal — a Penzu-style journaling app with an Ocean Blue theme.
Built with React (Create React App), Supabase (auth + Postgres with Row Level Security) and deployable to Vercel as an installable PWA.

## Features

- **Landing page** — sticky nav, animated gradient-blob hero, 6 feature cards, privacy section, CTA, footer
- **Auth** — email/password sign up (with name) and sign in, password show/hide, toast errors
- **Journals** — coloured covers with emoji, create / edit / delete (with confirmation)
- **Entries** — mood, title, 2-line preview, date and tags on each card
- **Editor** — Playfair Display title, full-page writing area, autosave 1.5 s after you stop typing (Ctrl/⌘+S saves instantly), mood picker, tags (Enter to add, × to remove), delete
- **Search** — searches titles and content across all journals, with highlighted previews
- **Settings** — update display name, change password, sign out
- **Mobile & PWA** — bottom tab bar on phones, 44 px touch targets, installable on iOS / Android

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase URL + anon key
npm start
```

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql) and run it.
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
supabase-schema.sql
vercel.json        SPA rewrites for client-side routing
```

## Deploy

Import the repo in Vercel (framework preset: **Create React App**), add `REACT_APP_SUPABASE_URL` and
`REACT_APP_SUPABASE_ANON_KEY` under **Settings → Environment Variables**, and deploy. In Supabase,
set **Authentication → URL Configuration → Site URL** to your Vercel URL.
