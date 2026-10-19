# SCP Foundation Field Catalogue

**COMP.6210 Web Services & Design Methodologies: Assignment 2**
Gustav Gous · Student ID 30041802 · Toi Ohomai

A React web app for browsing and managing a catalogue of SCP Foundation subjects. The data is stored in a cloud database (Supabase) and read and written through its REST API. Logged-in users have role-based permissions enforced by Row Level Security.

> **Status:** in development. The app currently reads 5 subjects from local JSON; the move to Supabase is in progress (see [Version history](#version-history)).

**Live site:** _coming soon (Netlify)_

## Features
**Current:**
- Catalogue index of subject cards, plus a detailed dossier page for each subject
- Responsive navigation with a full subject index
- Redaction styling for `[DATA REDACTED]` text
- Live database connection status in the header (reads the `object_classes` table from Supabase)

**Planned:**
- 20 subjects stored in Supabase
- Sign-up and login (Supabase Auth)
- Create, edit and delete subjects (editors and admins)
- Addenda: any logged-in user can add them, and authors can edit and delete their own

## Tech stack
| Layer | Technology |
|---|---|
| Front end | React 19, React Router 7, Vite 8 |
| Database and API | Supabase (PostgreSQL, auto-generated REST API) |
| Auth | Supabase Auth with Row Level Security |
| Images | Supabase Storage |
| Hosting | Netlify (auto-deploys from GitHub) |

## User roles
| Role | Permissions |
|---|---|
| Visitor (not logged in) | Read all subjects |
| Contributor (default on sign-up) | Add addenda to any subject; edit and delete their own addenda |
| Editor | Create subjects; edit and delete subjects they own |
| Admin | Full access |

Every permission is enforced in the database by Row Level Security policies, not just hidden in the UI.

## Project structure
```
src/
  components/   Shared UI (Header, Nav, Footer, Redacted, DbStatus)
  lib/          Supabase client (supabase.js)
  pages/        Route pages (Home, ScpDetail, NotFound)
  data/         Local JSON data (being replaced by Supabase)
  assets/       Images
supabase/
  schema.sql    Database tables, RLS policies, triggers, storage bucket
```

## Running locally
Requirements: Node.js 22+

```bash
npm install
cp .env.example .env    # then add your Supabase URL and publishable key
npm run dev             # http://localhost:5173
```

Other scripts: `npm run build` (production build to `dist/`), `npm run preview` (serve the build), `npm run lint` (Oxlint).

## Database setup
1. Create a Supabase project.
2. In the SQL Editor, run `supabase/schema.sql`.
3. Sign up a user (Authentication → Users → Add user), then set their `role` to `admin` in Table Editor → `profiles`.

## Version history
Each version is tagged in git (`git tag`), so the project can be restored to any of them.

| Version | Summary |
|---|---|
| v0.1.0 | Original React site with hardcoded JSON data; Netlify config |
| v0.1.1 | Housekeeping: database schema, environment-variable setup, README |
| v0.2.0 | Supabase client connected; live database status in the header; deployed to Netlify |
