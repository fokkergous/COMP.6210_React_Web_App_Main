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
- Sign-up with email verification, login and logout (Supabase Auth); the header shows the user's display name and role

**Planned:**
- 20 subjects stored in Supabase
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
  components/   Shared UI (Header, Nav, Footer, Redacted, DbStatus, AccountStatus)
  context/      Login state shared app-wide (AuthProvider, useAuth)
  lib/          Supabase client (supabase.js)
  pages/        Route pages (Home, ScpDetail, Login, NotFound)
  data/         Local JSON data (being replaced by Supabase)
  assets/       Images
supabase/
  schema.sql    Database tables, RLS policies, triggers, storage bucket
  seed.sql      Catalogue subjects and their sections (re-runnable)
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
3. In Authentication → URL Configuration, set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` to the Redirect URLs, so email confirmation links return to the app. Make sure "Confirm email" is on (Authentication → Sign In / Providers → Email).
4. Sign up a user (in the app, or Authentication → Users → Add user), then set their `role` to `admin` in Table Editor → `profiles`.
5. In Storage → `scp-images`, create a folder `seed` and upload the subject images from `src/assets/scp/` (not the logo).
6. In the SQL Editor, run `supabase/seed.sql`. It is safe to run again; the check query at the bottom of the file shows the expected section counts.

## Version history
Each version is tagged in git (`git tag`), so the project can be restored to any of them.

| Version | Summary |
|---|---|
| v0.1.0 | Original React site with hardcoded JSON data; Netlify config |
| v0.1.1 | Housekeeping: database schema, environment-variable setup, README |
| v0.2.0 | Supabase client connected; live database status in the header (verified locally) |
| v0.3.0 | Auth: sign-up with email verification, login/logout, user name and role in the header (verified locally) |
| v0.4.0 | Seed data: SCP-002 to SCP-006 and all their sections loaded into Supabase; images in Supabase Storage |
