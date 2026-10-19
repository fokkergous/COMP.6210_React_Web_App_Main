-- =====================================================================
-- SCP Foundation Catalogue: Supabase schema
-- COMP.6210 Assignment 2
--
-- Run this whole file in the Supabase dashboard: SQL Editor > New query.
-- It creates the tables, helper functions, triggers, Row Level Security
-- (RLS) policies and the image storage bucket the React app relies on.
--
-- Table layout
--   object_classes          lookup: Safe / Euclid / Keter (+ badge colour)
--   scp_subjects            one row per SCP: single-value fields only
--   containment_procedures  ┐
--   descriptions            │ one row per paragraph, many per subject,
--   subject_references      │ ordered by `position`
--   additional_notes        │
--   chronology_entries      ┘ (dated paragraphs)
--   appendices              0 or 1 per subject
--   field_reports           0 or 1 per subject
--   field_report_entries    many per field report
--   addenda                 many per subject, written by any logged-in user
--   profiles                one per user account (display name + role)
--
-- Single-value fields (item, summary, image...) are columns, not tables:
-- a table holding exactly one row per subject adds joins for no benefit.
-- Repeating sections are child tables: that is one-to-many data, and
-- storing it as arrays in a column would break first normal form.
--
-- Access model
--   Visitor (not logged in) : read everything
--   Contributor (default)   : read everything; add addenda to any subject;
--                             edit/delete their own addenda
--   Editor                  : as Contributor, plus create subjects; edit and
--                             delete only the subjects they own (including
--                             all of that subject's sections)
--   Admin                   : full access to everything
--
-- Roles live in public.profiles.role. New sign-ups are always
-- 'contributor'. Promote a user from the dashboard (Table Editor > profiles)
-- or the SQL Editor, both of which bypass RLS, e.g.
--   update public.profiles set role = 'admin' where id = '<user uuid>';
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Optional reset: uncomment to wipe these objects and start again.
--    WARNING: this deletes all data in these tables.
-- ---------------------------------------------------------------------
-- drop table if exists public.addenda cascade;
-- drop table if exists public.field_report_entries cascade;
-- drop table if exists public.field_reports cascade;
-- drop table if exists public.appendices cascade;
-- drop table if exists public.chronology_entries cascade;
-- drop table if exists public.additional_notes cascade;
-- drop table if exists public.subject_references cascade;
-- drop table if exists public.descriptions cascade;
-- drop table if exists public.containment_procedures cascade;
-- drop table if exists public.scp_subjects cascade;
-- drop table if exists public.object_classes cascade;
-- drop table if exists public.profiles cascade;
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user() cascade;
-- drop function if exists public.set_updated_at() cascade;
-- drop function if exists public.can_edit_subject(bigint) cascade;
-- drop function if exists public.is_admin() cascade;
-- drop function if exists public.current_user_role() cascade;
-- drop type if exists public.user_role;


-- ---------------------------------------------------------------------
-- 1. Enum type for user roles
--    An enum rejects typos ('Admin', 'editr') at the database level.
-- ---------------------------------------------------------------------
create type public.user_role as enum ('contributor', 'editor', 'admin');


-- ---------------------------------------------------------------------
-- 2. profiles: one row per auth user, holding their display name and role.
--    auth.users is managed by Supabase Auth and cannot hold custom columns,
--    so this table extends it one-to-one.
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  role         public.user_role not null default 'contributor',
  created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. object_classes: lookup table.
--    `tone` picks the badge colour in the UI (.class-label--green etc.),
--    replacing the CLASS_TONE map hardcoded in ScpDetail.jsx.
--    Admins can add more classes (e.g. Thaumiel) later.
-- ---------------------------------------------------------------------
create table public.object_classes (
  id          smallint generated always as identity primary key,
  name        text not null unique check (char_length(name) between 1 and 30),
  tone        text not null default 'amber' check (tone in ('green', 'amber', 'red')),
  description text
);

insert into public.object_classes (name, tone, description) values
  ('Safe',   'green', 'Understood well enough to be contained reliably and permanently.'),
  ('Euclid', 'amber', 'Not fully understood, or inherently unpredictable.'),
  ('Keter',  'red',   'Exceedingly difficult to contain consistently or reliably.');


-- ---------------------------------------------------------------------
-- 4. scp_subjects: the catalogue entries (single-value fields only).
-- ---------------------------------------------------------------------
create table public.scp_subjects (
  id              bigint generated always as identity primary key,

  -- 'SCP-002'. Must match SCP- followed by 3 or 4 digits.
  item            text not null unique check (item ~ '^SCP-[0-9]{3,4}$'),

  -- URL slug used by React Router (/scp-002). Derived, never typed in.
  slug            text generated always as (lower(item)) stored unique,

  -- RESTRICT: a class cannot be deleted while subjects still use it.
  object_class_id smallint not null references public.object_classes (id) on delete restrict,

  summary         text not null check (char_length(summary) between 1 and 300),

  -- Public image URL (Supabase Storage or external). NULL means the UI
  -- shows the placeholder image.
  image_url       text,
  image_alt       text,

  -- The editor who created the subject. Defaults to the logged-in user,
  -- so React never sends it. NULL for seeded subjects (admin-managed).
  -- SET NULL keeps the subject if its owner's account is deleted.
  owner_id        uuid default auth.uid() references public.profiles (id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index scp_subjects_owner_id_idx        on public.scp_subjects (owner_id);
create index scp_subjects_object_class_id_idx on public.scp_subjects (object_class_id);


-- ---------------------------------------------------------------------
-- 5. Paragraph section tables (one-to-many with scp_subjects).
--
--    All share the same shape: subject_id, position, body.
--    - ON DELETE CASCADE: deleting a subject deletes its paragraphs.
--    - `position` keeps paragraphs in order (SQL rows have no built-in
--      order); the app sorts by position ascending.
--    - (subject_id, position) is deliberately NOT unique, so React can
--      save edits by inserting the new paragraphs first and then deleting
--      the old ones by id. If the insert fails, the old text is untouched.
-- ---------------------------------------------------------------------

-- Special Containment Procedures. Required by the brief; the UI should
-- insist on at least one paragraph.
create table public.containment_procedures (
  id         bigint generated always as identity primary key,
  subject_id bigint not null references public.scp_subjects (id) on delete cascade,
  position   smallint not null check (position >= 1),
  body       text not null check (char_length(body) between 1 and 5000)
);
create index containment_procedures_subject_idx on public.containment_procedures (subject_id, position);

-- Description. Required by the brief; the UI should insist on at least one.
create table public.descriptions (
  id         bigint generated always as identity primary key,
  subject_id bigint not null references public.scp_subjects (id) on delete cascade,
  position   smallint not null check (position >= 1),
  body       text not null check (char_length(body) between 1 and 5000)
);
create index descriptions_subject_idx on public.descriptions (subject_id, position);

-- Reference section. Named subject_references because REFERENCES is a
-- reserved word in SQL.
create table public.subject_references (
  id         bigint generated always as identity primary key,
  subject_id bigint not null references public.scp_subjects (id) on delete cascade,
  position   smallint not null check (position >= 1),
  body       text not null check (char_length(body) between 1 and 5000)
);
create index subject_references_subject_idx on public.subject_references (subject_id, position);

-- Additional Notes section.
create table public.additional_notes (
  id         bigint generated always as identity primary key,
  subject_id bigint not null references public.scp_subjects (id) on delete cascade,
  position   smallint not null check (position >= 1),
  body       text not null check (char_length(body) between 1 and 5000)
);
create index additional_notes_subject_idx on public.additional_notes (subject_id, position);

-- Chronology: dated events. A real date type allows sorting and
-- formatting in the UI (source data uses US-style MM/DD/YYYY).
create table public.chronology_entries (
  id         bigint generated always as identity primary key,
  subject_id bigint not null references public.scp_subjects (id) on delete cascade,
  position   smallint not null check (position >= 1),
  event_date date not null,
  body       text not null check (char_length(body) between 1 and 5000)
);
create index chronology_entries_subject_idx on public.chronology_entries (subject_id, position);


-- ---------------------------------------------------------------------
-- 6. Single optional sections (zero or one per subject).
--    UNIQUE (subject_id) enforces "at most one per subject".
-- ---------------------------------------------------------------------
create table public.appendices (
  id         bigint generated always as identity primary key,
  subject_id bigint not null unique references public.scp_subjects (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  body       text not null check (char_length(body) between 1 and 5000)
);

create table public.field_reports (
  id         bigint generated always as identity primary key,
  subject_id bigint not null unique references public.scp_subjects (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  intro      text
);

-- Entries belong to a field report (not directly to a subject), so
-- deleting the report or the subject removes them via the cascade chain.
create table public.field_report_entries (
  id              bigint generated always as identity primary key,
  field_report_id bigint not null references public.field_reports (id) on delete cascade,
  position        smallint not null check (position >= 1),
  body            text not null check (char_length(body) between 1 and 5000)
);
create index field_report_entries_report_idx on public.field_report_entries (field_report_id, position);


-- ---------------------------------------------------------------------
-- 7. addenda: written by any logged-in user, not just the subject owner.
--    Kept separate from the owner-only sections so RLS can give
--    contributors INSERT here without any write access to the subject.
--    Ordered by created_at, so no position column.
-- ---------------------------------------------------------------------
create table public.addenda (
  id          bigint generated always as identity primary key,
  subject_id  bigint not null references public.scp_subjects (id) on delete cascade,
  author_id   uuid default auth.uid() references public.profiles (id) on delete set null,
  title       text not null check (char_length(title) between 1 and 120),
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index addenda_subject_id_idx on public.addenda (subject_id, created_at);
create index addenda_author_id_idx  on public.addenda (author_id);


-- ---------------------------------------------------------------------
-- 8. Helper functions used by the RLS policies.
--    These are NOT called by React; they just keep the policies short.
--    SECURITY DEFINER lets them read profiles/scp_subjects regardless of
--    the caller's own RLS restrictions.
-- ---------------------------------------------------------------------

-- Role of the currently logged-in user, or NULL for visitors.
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- True if the current user is an admin.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- True if the current user may change the given subject and its sections:
-- admins always; editors only for subjects they own.
create or replace function public.can_edit_subject(p_subject_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_admin()
      or (
        public.current_user_role() = 'editor'
        and exists (
          select 1 from public.scp_subjects s
          where s.id = p_subject_id and s.owner_id = auth.uid()
        )
      );
$$;


-- ---------------------------------------------------------------------
-- 9. Triggers
-- ---------------------------------------------------------------------

-- Create a profile automatically whenever someone signs up. The React
-- sign-up form passes display_name via
--   supabase.auth.signUp({ email, password, options: { data: { display_name } } })
-- Role is NOT read from sign-up data, so nobody can sign up as an admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
             split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at accurate on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scp_subjects_set_updated_at
  before update on public.scp_subjects
  for each row execute function public.set_updated_at();

create trigger addenda_set_updated_at
  before update on public.addenda
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 10. Table privileges
--    Grants decide which operations a role may attempt at all; RLS
--    (below) then decides which rows. Stated explicitly rather than
--    relying on project defaults.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.profiles, public.object_classes, public.scp_subjects,
  public.containment_procedures, public.descriptions, public.subject_references,
  public.additional_notes, public.chronology_entries, public.appendices,
  public.field_reports, public.field_report_entries, public.addenda
to anon, authenticated;

grant insert, update, delete on
  public.object_classes, public.scp_subjects,
  public.containment_procedures, public.descriptions, public.subject_references,
  public.additional_notes, public.chronology_entries, public.appendices,
  public.field_reports, public.field_report_entries, public.addenda
to authenticated;

-- profiles: only display_name may be changed by users. Without this, a
-- user could set their own role to 'admin'. Column privileges are checked
-- before RLS.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 11. Row Level Security
--    With RLS enabled, every request is denied unless a policy allows it.
--    'anon' = visitor, 'authenticated' = logged-in user.
--    Every table is publicly readable; the policies below differ only in
--    who may write.
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.object_classes         enable row level security;
alter table public.scp_subjects           enable row level security;
alter table public.containment_procedures enable row level security;
alter table public.descriptions           enable row level security;
alter table public.subject_references     enable row level security;
alter table public.additional_notes       enable row level security;
alter table public.chronology_entries     enable row level security;
alter table public.appendices             enable row level security;
alter table public.field_reports          enable row level security;
alter table public.field_report_entries   enable row level security;
alter table public.addenda                enable row level security;

-- ---- profiles ----
create policy "Profiles are publicly readable"
  on public.profiles for select to anon, authenticated
  using (true);

-- Users can update their own row (display_name only, see grants above).
-- No insert/delete policies: the sign-up trigger creates profiles and the
-- auth.users cascade removes them.
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- object_classes ----
create policy "Object classes are publicly readable"
  on public.object_classes for select to anon, authenticated
  using (true);

create policy "Admins can manage object classes"
  on public.object_classes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- scp_subjects ----
create policy "Subjects are publicly readable"
  on public.scp_subjects for select to anon, authenticated
  using (true);

-- Editors must set themselves as owner (the column default does this).
create policy "Editors and admins can create subjects"
  on public.scp_subjects for insert to authenticated
  with check (
    public.is_admin()
    or (public.current_user_role() = 'editor' and owner_id = auth.uid())
  );

-- WITH CHECK stops an editor handing ownership to someone else.
create policy "Owners and admins can update subjects"
  on public.scp_subjects for update to authenticated
  using (
    public.is_admin()
    or (public.current_user_role() = 'editor' and owner_id = auth.uid())
  )
  with check (
    public.is_admin()
    or (public.current_user_role() = 'editor' and owner_id = auth.uid())
  );

create policy "Owners and admins can delete subjects"
  on public.scp_subjects for delete to authenticated
  using (
    public.is_admin()
    or (public.current_user_role() = 'editor' and owner_id = auth.uid())
  );

-- ---- section tables ----
-- Same pair of policies on each: public read, and write (insert, update,
-- delete via FOR ALL) only if the user can edit the parent subject.
-- WITH CHECK also stops a paragraph being moved onto someone else's subject.

create policy "Containment procedures are publicly readable"
  on public.containment_procedures for select to anon, authenticated
  using (true);
create policy "Subject editors can write containment procedures"
  on public.containment_procedures for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "Descriptions are publicly readable"
  on public.descriptions for select to anon, authenticated
  using (true);
create policy "Subject editors can write descriptions"
  on public.descriptions for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "References are publicly readable"
  on public.subject_references for select to anon, authenticated
  using (true);
create policy "Subject editors can write references"
  on public.subject_references for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "Additional notes are publicly readable"
  on public.additional_notes for select to anon, authenticated
  using (true);
create policy "Subject editors can write additional notes"
  on public.additional_notes for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "Chronology entries are publicly readable"
  on public.chronology_entries for select to anon, authenticated
  using (true);
create policy "Subject editors can write chronology entries"
  on public.chronology_entries for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "Appendices are publicly readable"
  on public.appendices for select to anon, authenticated
  using (true);
create policy "Subject editors can write appendices"
  on public.appendices for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

create policy "Field reports are publicly readable"
  on public.field_reports for select to anon, authenticated
  using (true);
create policy "Subject editors can write field reports"
  on public.field_reports for all to authenticated
  using (public.can_edit_subject(subject_id))
  with check (public.can_edit_subject(subject_id));

-- Field report entries link to a report, not a subject, so look up the
-- report's subject first.
create policy "Field report entries are publicly readable"
  on public.field_report_entries for select to anon, authenticated
  using (true);
create policy "Subject editors can write field report entries"
  on public.field_report_entries for all to authenticated
  using (public.can_edit_subject(
    (select fr.subject_id from public.field_reports fr where fr.id = field_report_id)))
  with check (public.can_edit_subject(
    (select fr.subject_id from public.field_reports fr where fr.id = field_report_id)));

-- ---- addenda ----
create policy "Addenda are publicly readable"
  on public.addenda for select to anon, authenticated
  using (true);

-- Any logged-in user can add an addendum to any subject, as themselves.
create policy "Logged-in users can add addenda"
  on public.addenda for insert to authenticated
  with check (author_id = auth.uid());

-- Authors can edit their own addenda; admins can edit any.
create policy "Authors and admins can update addenda"
  on public.addenda for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- Authors can delete their own addenda; admins can delete any.
create policy "Authors and admins can delete addenda"
  on public.addenda for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());


-- ---------------------------------------------------------------------
-- 12. Storage bucket for subject images
--    Public bucket = images load via plain URL with no auth.
--    Uploads go into a folder named after the uploader's user id, e.g.
--    scp-images/<uuid>/scp-021.jpg, so users can only touch their own files.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scp-images', 'scp-images', true)
on conflict (id) do nothing;

create policy "SCP images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'scp-images');

create policy "Editors and admins can upload SCP images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'scp-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.current_user_role() in ('editor', 'admin')
  );

create policy "Uploaders and admins can replace SCP images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'scp-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Uploaders and admins can delete SCP images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'scp-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
