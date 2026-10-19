// Creating, editing and deleting SCP subjects in Supabase.
//
// A subject is spread over several tables (scp_subjects plus one table per
// section), and Postgres functions are out of scope for this project, so
// every save is a sequence of separate requests. Each function below is
// ordered so that a failure part-way never loses existing content:
//
//   create  image -> subject row -> sections. On failure the new subject is
//           deleted (ON DELETE CASCADE removes its sections) and the image
//           removed, so no half-made file is left behind.
//   edit    image -> subject row -> each section replaced by inserting the
//           new rows first and only then deleting the old ones. If a step
//           fails, every section still holds either its old or its new text.
//   delete  subject row (the cascade removes sections and addenda) -> image.
//
// Permission comes from the database's Row Level Security policies: only
// editors and admins may create subjects (and become their owner), and only
// the owning editor or an admin may edit or delete one. When RLS refuses an
// update or delete, Supabase changes nothing but reports no error, so those
// requests ask for the affected rows back and treat "none" as refused.
import { supabase } from './supabase';

const BUCKET = 'scp-images';

// Must match the CHECK constraints in schema.sql.
export const SUBJECT_LIMITS = { summary: 300, body: 5000, title: 120 };
export const ITEM_PATTERN = /^SCP-[0-9]{3,4}$/;

// Largest image accepted, checked in the browser before uploading.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const NOT_PERMITTED = 'You do not have permission to change this file.';

// The values of a blank subject form (SubjectForm.jsx). The two required
// sections start with one empty paragraph each; optional sections start empty.
export const EMPTY_SUBJECT = {
  item: '',
  objectClassId: '',
  summary: '',
  imageAlt: '',
  containmentProcedures: [''],
  description: [''],
  reference: [],
  additionalNotes: [],
  chronology: [],
  appendix: { title: '', body: '' },
  fieldReport: { title: '', intro: '', entries: [] },
};

// Whether the current user may edit or delete a subject. Mirrors the RLS
// policies on scp_subjects: admins may change any subject; editors only the
// ones they own. Seeded subjects have no owner, so only admins match.
export function canManageSubject(user, role, ownerId) {
  if (!user) return false;
  return role === 'admin' || (role === 'editor' && ownerId === user.id);
}

// A loaded dossier (lib/subjects.js) -> the values SubjectForm edits.
export function dossierToFormValues(entry) {
  return {
    item: entry.item,
    objectClassId: String(entry.objectClassId ?? ''),
    summary: entry.summary,
    imageAlt: entry.imageAltText,
    // Required sections always show at least one box.
    containmentProcedures: entry.containmentProcedures.length ? [...entry.containmentProcedures] : [''],
    description: entry.description.length ? [...entry.description] : [''],
    reference: [...(entry.reference ?? [])],
    additionalNotes: [...(entry.additionalNotes ?? [])],
    // The form's date picker needs YYYY-MM-DD, not the displayed DD/MM/YYYY.
    chronology: (entry.chronology ?? []).map((c) => ({ date: c.isoDate, text: c.text })),
    appendix: entry.appendix
      ? { title: entry.appendix.title, body: entry.appendix.text }
      : { title: '', body: '' },
    fieldReport: entry.fieldReport
      ? { title: entry.fieldReport.title, intro: entry.fieldReport.intro ?? '', entries: [...entry.fieldReport.entries] }
      : { title: '', intro: '', entries: [] },
  };
}

// ---------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------

// Create a subject with all its sections.
//   values     cleaned form values (see SubjectForm.jsx)
//   imageFile  a File from the image input, or null
//   userId     the logged-in user's id (images go in a folder named after it)
// Returns the new subject's slug, e.g. 'scp-022'.
export async function createSubject(values, imageFile, userId) {
  let uploadedPath = null;
  let subjectId = null;

  try {
    // 1. Image
    let imageUrl = null;
    if (imageFile) {
      const uploaded = await uploadSubjectImage(imageFile, userId, values.item);
      uploadedPath = uploaded.path;
      imageUrl = uploaded.publicUrl;
    }

    // 2. The subject row. owner_id is not sent: the database sets it to the
    // logged-in user (column default auth.uid()), and RLS checks it.
    const { data: subject, error } = await supabase
      .from('scp_subjects')
      .insert({
        item: values.item,
        object_class_id: values.objectClassId,
        summary: values.summary,
        image_url: imageUrl,
        image_alt: values.imageAlt || null,
      })
      .select('id, slug')
      .single();

    if (error) throw friendlyError(error);
    subjectId = subject.id;

    // 3. Sections
    await saveSections(subjectId, values);

    return subject.slug;
  } catch (err) {
    // Undo whatever was saved before the failure. Problems while cleaning up
    // are only logged, so the user sees the original error.
    if (subjectId) {
      const { error } = await supabase.from('scp_subjects').delete().eq('id', subjectId);
      if (error) console.error('Cleanup: could not delete the partial subject:', error.message);
    }
    if (uploadedPath) await removeImagePath(uploadedPath);
    throw err;
  }
}

// ---------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------

// Save changes to an existing subject.
//   subject  the loaded dossier being edited (needs dbId and image)
//   values   cleaned form values
//   image    { file, remove }: a new image File to use, or remove = true to
//            drop the current image; neither keeps the current image
//   userId   the logged-in user's id (new images go in their folder)
// Returns the subject's slug, which changes if the item number changed.
export async function updateSubject(subject, values, image, userId) {
  let uploadedPath = null;
  let rowUpdated = false;

  // Which image the subject should end up with.
  let imageUrl = subject.image ?? null;

  try {
    // 1. New image
    if (image.file) {
      const uploaded = await uploadSubjectImage(image.file, userId, values.item);
      uploadedPath = uploaded.path;
      imageUrl = uploaded.publicUrl;
    } else if (image.remove) {
      imageUrl = null;
    }

    // 2. The subject row. If the item number changed, the database's
    // generated slug column changes with it (e.g. /scp-022 -> /scp-030).
    const { data, error } = await supabase
      .from('scp_subjects')
      .update({
        item: values.item,
        object_class_id: values.objectClassId,
        summary: values.summary,
        image_url: imageUrl,
        image_alt: values.imageAlt || null,
      })
      .eq('id', subject.dbId)
      .select('slug');

    if (error) throw friendlyError(error);
    if (data.length === 0) throw new Error(NOT_PERMITTED); // refused by RLS
    rowUpdated = true;

    // 3. Sections
    await saveSections(subject.dbId, values, { replace: true });

    // 4. The old image is no longer used: remove it (never a seed image).
    if (imageUrl !== subject.image) await removeStoredImage(subject.image);

    return data[0].slug;
  } catch (err) {
    // A new image was uploaded but the save didn't finish: point the subject
    // back at its old image (if the row already changed) and remove the new file.
    if (uploadedPath) {
      if (rowUpdated) {
        const { error } = await supabase
          .from('scp_subjects')
          .update({ image_url: subject.image ?? null })
          .eq('id', subject.dbId);
        if (error) console.error('Cleanup: could not restore the previous image:', error.message);
      }
      await removeImagePath(uploadedPath);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------

// Delete a subject. ON DELETE CASCADE removes its sections and addenda;
// then its uploaded image is removed from Storage (seed images are kept).
export async function deleteSubject(subject) {
  const { data, error } = await supabase
    .from('scp_subjects')
    .delete()
    .eq('id', subject.dbId)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new Error(NOT_PERMITTED); // refused by RLS

  await removeStoredImage(subject.image);
}

// ---------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------

// Save every section of a subject. For a new subject the rows are simply
// inserted. When editing (replace: true) each section's old rows are swapped
// for the new ones, and optional sections that were emptied are removed.
// Paragraph lists are saved with position 1, 2, 3... so they keep their order.
async function saveSections(subjectId, values, { replace = false } = {}) {
  const save = replace
    ? (table, rows) => replaceRows(table, 'subject_id', subjectId, rows)
    : (table, rows) => insertRows(table, rows);

  const paragraphRows = (paragraphs) =>
    paragraphs.map((body, i) => ({ subject_id: subjectId, position: i + 1, body }));

  await save('containment_procedures', paragraphRows(values.containmentProcedures));
  await save('descriptions', paragraphRows(values.description));
  await save('subject_references', paragraphRows(values.reference));
  await save('additional_notes', paragraphRows(values.additionalNotes));
  await save(
    'chronology_entries',
    values.chronology.map((entry, i) => ({
      subject_id: subjectId,
      position: i + 1,
      // <input type="date"> already gives YYYY-MM-DD, which Postgres accepts.
      event_date: entry.date,
      body: entry.text,
    }))
  );

  // Appendix and field report: at most one per subject (subject_id is
  // UNIQUE), so they are updated in place rather than swapped.
  if (values.appendix) {
    // upsert = update the existing row for this subject, or insert one.
    const { error } = await supabase
      .from('appendices')
      .upsert(
        { subject_id: subjectId, title: values.appendix.title, body: values.appendix.body },
        { onConflict: 'subject_id' }
      );
    if (error) throw error;
  } else if (replace) {
    await deleteWhere('appendices', 'subject_id', subjectId);
  }

  if (values.fieldReport) {
    // The report row first, because its entries need the report's id.
    const { data: report, error } = await supabase
      .from('field_reports')
      .upsert(
        { subject_id: subjectId, title: values.fieldReport.title, intro: values.fieldReport.intro || null },
        { onConflict: 'subject_id' }
      )
      .select('id')
      .single();
    if (error) throw error;

    const entryRows = values.fieldReport.entries.map((body, i) => ({
      field_report_id: report.id,
      position: i + 1,
      body,
    }));
    if (replace) await replaceRows('field_report_entries', 'field_report_id', report.id, entryRows);
    else await insertRows('field_report_entries', entryRows);
  } else if (replace) {
    // Removing the report also removes its entries (ON DELETE CASCADE).
    await deleteWhere('field_reports', 'subject_id', subjectId);
  }
}

// Swap a section's rows: note the old rows' ids, insert the new rows, and
// only then delete the old ones. If the insert fails, the old text is
// untouched. (This is why schema.sql does not make (subject_id, position)
// unique: old and new rows exist side by side for a moment.)
async function replaceRows(table, column, value, newRows) {
  const { data: oldRows, error } = await supabase.from(table).select('id').eq(column, value);
  if (error) throw error;

  await insertRows(table, newRows);

  if (oldRows.length > 0) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .in('id', oldRows.map((row) => row.id));
    if (deleteError) throw deleteError;
  }
}

// One request inserts all of a section's rows at once.
async function insertRows(table, rows) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

async function deleteWhere(table, column, value) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------

// Upload an image into the user's own folder of the scp-images bucket and
// return its storage path and public URL. The storage RLS policy only
// allows editors and admins to upload, and only into <their user id>/...
async function uploadSubjectImage(file, userId, item) {
  const extension = file.name.split('.').pop().toLowerCase();
  // The timestamp keeps names unique, so a new image never overwrites one
  // that is still in use.
  const path = `${userId}/${item.toLowerCase()}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`The image could not be uploaded: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

// Remove an image that is no longer used, given its public URL. Seed images
// (scp-images/seed/...) are always kept, and URLs outside this bucket are
// ignored. Failures are only logged: a leftover file does no harm.
async function removeStoredImage(publicUrl) {
  const path = storagePathFromUrl(publicUrl);
  if (!path || path.startsWith('seed/')) return;
  await removeImagePath(path);
}

async function removeImagePath(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error(`Could not remove image ${path}:`, error.message);
}

// '…/storage/v1/object/public/scp-images/<path>' -> '<path>' (or null).
function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url ? url.indexOf(marker) : -1;
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

// Turn database errors the user can fix into plain messages.
function friendlyError(error) {
  // 23505 = unique_violation: the item number (and so the slug) is taken.
  if (error.code === '23505') {
    return new Error('That item number is already in use. Choose another.');
  }
  // 42501 = insufficient_privilege: RLS refused the change.
  if (error.code === '42501') {
    return new Error('Your account does not have clearance to save this file.');
  }
  return error;
}
