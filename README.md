# SCP Foundation Field Catalogue

**COMP.6210 Web Services & Design Methodologies: Assignment 2**
Gustav Gous · Student ID 30041802 · Toi Ohomai

A React web app for browsing and managing a catalogue of SCP Foundation subjects. The data is stored in a cloud database (Supabase) and read and written through its REST API. Logged-in users have role-based permissions enforced by Row Level Security.

> **Status:** in development. All subject data and images are read from Supabase; editing features are in progress (see [Version history](#version-history)).

**Live site:** _coming soon (Netlify)_

## Features
**Current:**
- Catalogue of 20 subjects (SCP-002 to SCP-021): index of subject cards, plus a detailed dossier page for each subject, all read from Supabase
- Navigation bar with a drop-down file index that stays one line however many subjects there are
- Loading and error states (with retry) for every database request
- Placeholder image when a subject's image is missing or fails to load
- Dates shown as DD/MM/YYYY
- Redaction styling for `[DATA REDACTED]` text
- Live database connection status in the header (reads the `object_classes` table from Supabase)
- Sign-up with email verification, login and logout (Supabase Auth); the header shows the user's display name and role
- Addenda: any logged-in user can file one on any subject; authors can edit and delete their own (admins can manage all), with a confirmation dialog before deleting. Each addendum shows its author and date
- Create subjects (editors and admins): a full dossier form with every section, image upload to Supabase Storage and validation; a failed save is undone so no partial file is left behind
- Edit and delete subjects (the owning editor or an admin): the same form pre-filled, item number changes (the URL follows), keep/replace/remove the image, and a confirmation dialog before deleting a file with all its sections and addenda

**Planned:**
- Images for SCP-007 to SCP-021 (they currently show the placeholder)
- Cloud deployment (Netlify)

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
  components/   Shared UI (Header, Nav, Footer, Redacted, DbStatus, AccountStatus,
                SubjectImage, FileStatus, Addenda, AddendumForm, ConfirmDialog,
                SubjectForm, ParagraphListField, ChronologyField, ClearanceRequired)
  context/      State shared app-wide: login (AuthProvider, useAuth) and the
                catalogue list (SubjectsProvider, useSubjects)
  hooks/        useSubject: loads one full subject for the dossier page
  lib/          Supabase client (supabase.js), subject queries (subjects.js),
                subject writes (subjectWrites.js) and addendum writes (addenda.js)
  pages/        Route pages (Home, ScpDetail, NewSubject, EditSubject, Login, NotFound)
  assets/       Logo and placeholder image (subject images live in Supabase Storage)
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
5. In Storage → `scp-images`, create a folder `seed` and upload the subject images (`scp-002.jpg` … `scp-006.jpg`, with `scp-005.png`). The originals were removed from the code in v0.5.0; get them from the `v0.4.0` tag (`git checkout v0.4.0 -- src/assets/scp`) if setting up a new project. SCP-007 to SCP-021 expect `scp-007.jpg` … `scp-021.jpg` and show a placeholder until those are uploaded.
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
| v0.5.0 | App reads all subjects from Supabase; loading/error states; placeholder image; DD/MM/YYYY dates; local JSON and images removed |
| v0.6.0 | 20 subjects: SCP-007 to SCP-021 added to the seed; navigation reworked into a drop-down file index |
| v0.7.0 | Addenda: add, edit and delete your own (admins: all), author and date bylines, delete confirmation dialog; first writes to Supabase, enforced by RLS |
| v0.8.0 | Create subjects: `/new` form for editors and admins (all sections, image upload, validation), table-by-table save with cleanup on failure |
| v0.9.0 | Edit and delete subjects (owner or admin): pre-filled form, editable item number, image keep/replace/remove, sections replaced insert-then-delete; full CRUD complete |

## Credits
SCP Foundation content is adapted from the [SCP Wiki](https://scp-wiki.wikidot.com) and its authors, used under the [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/) licence. Subject text in this project has been rewritten and shortened; SCP-014 is an original subject.
