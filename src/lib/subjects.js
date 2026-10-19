// Reading SCP subjects from Supabase.
//
// The pages never talk to Supabase directly: they call these functions.
// The results are converted into the same shape the original scpData.json
// had, so ScpDetail.jsx renders database subjects with its existing layout.
import { supabase } from './supabase';

// Columns needed for the Home cards and the Nav links.
// object_classes(name, tone) follows the object_class_id foreign key and
// returns the matching row from the lookup table as a nested object.
const LIST_COLUMNS = 'item, slug, summary, image_url, image_alt, object_classes(name, tone)';

// Everything needed for one dossier page. Each name in brackets is a related
// table; Supabase joins them through their foreign keys and returns them
// nested inside the subject, so one request fetches the whole file.
const DETAIL_COLUMNS = `
  id, item, slug, summary, image_url, image_alt, owner_id, object_class_id,
  object_classes(name, tone),
  containment_procedures(position, body),
  descriptions(position, body),
  subject_references(position, body),
  additional_notes(position, body),
  chronology_entries(position, event_date, body),
  appendices(title, body),
  field_reports(title, intro, field_report_entries(position, body)),
  addenda(id, title, body, created_at, updated_at, author_id, profiles(display_name))
`;

// Fetch the catalogue list, ordered by item number (SCP-002, SCP-003, ...).
// Throws if the request fails, so the caller can show an error message.
export async function fetchSubjectList() {
  const { data, error } = await supabase
    .from('scp_subjects')
    .select(LIST_COLUMNS)
    .order('item');

  if (error) throw error;
  return data.map(toCard);
}

// Fetch one full subject by its URL slug (e.g. 'scp-002').
// Returns null if no subject has that slug; throws if the request fails.
export async function fetchSubject(slug) {
  const { data, error } = await supabase
    .from('scp_subjects')
    .select(DETAIL_COLUMNS)
    .eq('slug', slug)
    // maybeSingle: return one row or null. (single() would treat
    // "no rows" as an error, but an unknown slug is a normal 404.)
    .maybeSingle();

  if (error) throw error;
  return data ? toDossier(data) : null;
}

// Fetch the object classes (Safe, Euclid, Keter, ...) for the class
// drop-down on the subject form, in the order they were added.
export async function fetchObjectClasses() {
  const { data, error } = await supabase
    .from('object_classes')
    .select('id, name')
    .order('id');

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------
// Converting database rows into the shape the pages use
// ---------------------------------------------------------------------

// A subject list row -> a card / nav link.
function toCard(row) {
  return {
    id: row.slug, // the URL part, e.g. /scp-002
    item: row.item,
    summary: row.summary,
    image: row.image_url,
    imageAlt: row.image_alt || `${row.item} image`,
    objectClass: row.object_classes?.name,
    tone: row.object_classes?.tone,
  };
}

// A full subject row -> the dossier object ScpDetail.jsx renders.
// Optional sections become null when empty, so the page skips them.
function toDossier(row) {
  const appendix = oneOrNull(row.appendices);
  const fieldReport = oneOrNull(row.field_reports);

  return {
    ...toCard(row),
    // The numeric primary key, needed when writing rows that belong to this
    // subject (e.g. a new addendum). Separate from `id`, which is the slug
    // used in URLs.
    dbId: row.id,
    ownerId: row.owner_id,
    // Raw values the edit form needs (the fields above are for display).
    objectClassId: row.object_class_id,
    imageAltText: row.image_alt ?? '',
    containmentProcedures: bodies(row.containment_procedures),
    description: bodies(row.descriptions),
    reference: nullIfEmpty(bodies(row.subject_references)),
    additionalNotes: nullIfEmpty(bodies(row.additional_notes)),
    chronology: nullIfEmpty(
      sortByPosition(row.chronology_entries).map((entry) => ({
        date: formatDate(entry.event_date),
        // YYYY-MM-DD, the format the edit form's date picker needs
        isoDate: entry.event_date,
        text: entry.body,
      }))
    ),
    appendix: appendix && { title: appendix.title, text: appendix.body },
    fieldReport: fieldReport && {
      title: fieldReport.title,
      intro: fieldReport.intro,
      entries: bodies(fieldReport.field_report_entries),
    },
    // Addenda have no position column; they are shown oldest first.
    addenda: nullIfEmpty(
      [...(row.addenda ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((addendum) => ({
          id: addendum.id,
          title: addendum.title,
          text: addendum.body,
          authorId: addendum.author_id,
          // null for the original (seeded) addenda, which have no author
          authorName: addendum.profiles?.display_name ?? null,
          createdAt: addendum.created_at,
          // updated_at is set by a database trigger whenever the row changes
          edited: addendum.updated_at > addendum.created_at,
        }))
    ),
  };
}

// Rows have no guaranteed order in SQL, so sort by the position column
// to get paragraphs back in their original order.
function sortByPosition(rows = []) {
  return [...rows].sort((a, b) => a.position - b.position);
}

// Ordered rows -> just their paragraph text.
function bodies(rows) {
  return sortByPosition(rows).map((row) => row.body);
}

function nullIfEmpty(list) {
  return list.length > 0 ? list : null;
}

// Supabase returns a zero-or-one relationship (appendix, field report) as a
// single object or null. Accept an array too, in case it is ever returned
// that way, and take its first item.
function oneOrNull(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// '1949-07-02' (how Postgres sends a date) -> '02/07/1949' (DD/MM/YYYY).
// Done by splitting the text rather than with new Date(), which reads the
// value as midnight UTC and can show the previous day in some time zones.
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

// A timestamp such as '2026-10-19T05:44:32+00:00' (an exact moment, stored
// in UTC) -> DD/MM/YYYY in the viewer's own time zone. Unlike formatDate,
// the time zone matters here: the same moment can be a different calendar
// day in New Zealand than in UTC, so the browser converts it first.
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-NZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  return DAY_MONTH_YEAR.format(new Date(timestamp));
}
