// Creating SCP subjects in Supabase.
//
// A subject is spread over several tables (scp_subjects plus one table per
// section), and Postgres functions are out of scope for this project, so a
// save is a sequence of separate requests:
//
//   1. upload the image to Storage (if one was chosen)
//   2. insert the scp_subjects row
//   3. insert each section's rows, one request per table
//
// If any step fails, the steps already done are undone: the new subject is
// deleted (ON DELETE CASCADE removes any sections already saved) and the
// uploaded image is removed. That way a failed save never leaves half a
// subject in the catalogue.
//
// Permission comes from the database's Row Level Security policies: only
// editors and admins may insert subjects, and the subject's owner_id is
// filled in with the logged-in user's id by the column default.
import { supabase } from './supabase';

const BUCKET = 'scp-images';

// Must match the CHECK constraints in schema.sql.
export const SUBJECT_LIMITS = { summary: 300, body: 5000, title: 120 };
export const ITEM_PATTERN = /^SCP-[0-9]{3,4}$/;

// Largest image accepted, checked in the browser before uploading.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

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
    await insertSections(subjectId, values);

    return subject.slug;
  } catch (err) {
    // Undo whatever was saved before the failure. Problems while cleaning up
    // are only logged, so the user sees the original error.
    if (subjectId) {
      const { error } = await supabase.from('scp_subjects').delete().eq('id', subjectId);
      if (error) console.error('Cleanup: could not delete the partial subject:', error.message);
    }
    if (uploadedPath) {
      const { error } = await supabase.storage.from(BUCKET).remove([uploadedPath]);
      if (error) console.error('Cleanup: could not remove the uploaded image:', error.message);
    }
    throw err;
  }
}

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

// Insert every non-empty section for a subject. Paragraph lists are saved
// with position 1, 2, 3... so they come back in the same order.
async function insertSections(subjectId, values) {
  await insertParagraphs('containment_procedures', subjectId, values.containmentProcedures);
  await insertParagraphs('descriptions', subjectId, values.description);
  await insertParagraphs('subject_references', subjectId, values.reference);
  await insertParagraphs('additional_notes', subjectId, values.additionalNotes);

  if (values.chronology.length > 0) {
    await insertRows(
      'chronology_entries',
      values.chronology.map((entry, i) => ({
        subject_id: subjectId,
        position: i + 1,
        // <input type="date"> already gives YYYY-MM-DD, which Postgres accepts.
        event_date: entry.date,
        body: entry.text,
      }))
    );
  }

  if (values.appendix) {
    await insertRows('appendices', [
      { subject_id: subjectId, title: values.appendix.title, body: values.appendix.body },
    ]);
  }

  if (values.fieldReport) {
    // The report row first, because its entries need the report's id.
    const { data: report, error } = await supabase
      .from('field_reports')
      .insert({
        subject_id: subjectId,
        title: values.fieldReport.title,
        intro: values.fieldReport.intro || null,
      })
      .select('id')
      .single();
    if (error) throw error;

    await insertRows(
      'field_report_entries',
      values.fieldReport.entries.map((body, i) => ({
        field_report_id: report.id,
        position: i + 1,
        body,
      }))
    );
  }
}

// One request inserts all of a section's paragraphs at once.
async function insertParagraphs(table, subjectId, paragraphs) {
  if (paragraphs.length === 0) return;
  await insertRows(
    table,
    paragraphs.map((body, i) => ({ subject_id: subjectId, position: i + 1, body }))
  );
}

async function insertRows(table, rows) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

// Turn database errors the user can fix into plain messages.
function friendlyError(error) {
  // 23505 = unique_violation: the item number (and so the slug) is taken.
  if (error.code === '23505') {
    return new Error('That item number is already in use. Choose another.');
  }
  // 42501 = insufficient_privilege: RLS refused the insert.
  if (error.code === '42501') {
    return new Error('Your account does not have editor clearance to create files.');
  }
  return error;
}
