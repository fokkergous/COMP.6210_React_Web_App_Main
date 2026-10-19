import { useEffect, useState } from 'react';
import ParagraphListField from './ParagraphListField';
import ChronologyField from './ChronologyField';
import { ITEM_PATTERN, MAX_IMAGE_BYTES, SUBJECT_LIMITS } from '../lib/subjectWrites';

// The form for a whole subject file: identification, image, the two required
// sections and the optional sections. It only collects and checks the values;
// saving is done by the page that uses it, through onSubmit. Used both to
// create a subject (NewSubject.jsx) and to edit one (EditSubject.jsx).
//
//   initialValues     starting values (EMPTY_SUBJECT for a new file; an
//                     existing subject's values when editing)
//   existingImageUrl  the subject's current image when editing, else null
//   objectClasses     [{ id, name }] for the class drop-down
//   submitLabel       text of the save button
//   onSubmit(values, image)  async; image is { file, remove }; throw an
//                            Error to show its message
//   onCancel()
function SubjectForm({ initialValues, existingImageUrl = null, objectClasses, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues);
  const [imageFile, setImageFile] = useState(null);
  // Editing only: true when the user chose to remove the current image.
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [problems, setProblems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Update one field, keeping the rest.
  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  // Show a preview of the chosen image. The temporary object URL is released
  // when the image changes or the form closes, so it doesn't leak memory.
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(event) {
    setImageFile(event.target.files[0] ?? null);
    // Choosing a new image replaces the current one rather than removing it.
    setRemoveImage(false);
  }

  // Which image the subject will have after saving.
  const keepsCurrentImage = existingImageUrl && !imageFile && !removeImage;

  async function handleSubmit(event) {
    // Stop the browser reloading the page; React handles the form instead.
    event.preventDefault();

    const cleaned = cleanValues(values);
    const found = validate(cleaned, imageFile);
    setProblems(found);
    if (found.length > 0) return;

    setSaving(true);
    try {
      await onSubmit(cleaned, { file: imageFile, remove: removeImage });
      // On success the page navigates away, so there is nothing to reset.
    } catch (err) {
      setProblems([err.message]);
      setSaving(false);
    }
  }

  return (
    <form className="subject-form" onSubmit={handleSubmit} noValidate>
      {/* ---------- Identification ---------- */}
      <fieldset className="form-section">
        <legend>Identification</legend>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="subject-item">Item number</label>
            <input
              id="subject-item"
              type="text"
              placeholder="SCP-022"
              value={values.item}
              // Item numbers are always upper case: SCP-022, not scp-022.
              onChange={(e) => setField('item', e.target.value.toUpperCase())}
            />
            <span className="form-hint">SCP- followed by 3 or 4 digits.</span>
          </div>

          <div className="form-field">
            <label htmlFor="subject-class">Object class</label>
            <select
              id="subject-class"
              value={values.objectClassId}
              onChange={(e) => setField('objectClassId', e.target.value)}
            >
              <option value="">Choose a class…</option>
              {objectClasses.map((oc) => (
                <option key={oc.id} value={oc.id}>
                  {oc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="subject-summary">Summary</label>
          <textarea
            id="subject-summary"
            rows={3}
            maxLength={SUBJECT_LIMITS.summary}
            value={values.summary}
            onChange={(e) => setField('summary', e.target.value)}
          />
          <span className="form-hint">
            Shown on the catalogue card. {values.summary.length} / {SUBJECT_LIMITS.summary} characters.
          </span>
        </div>
      </fieldset>

      {/* ---------- Image ---------- */}
      <fieldset className="form-section">
        <legend>Image</legend>
        <p className="form-hint">
          Optional. JPG, PNG or WebP up to {MAX_IMAGE_BYTES / 1024 / 1024} MB. Without an image the file shows a
          placeholder.
        </p>

        {/* Editing: show the current image with a way to remove it. */}
        {keepsCurrentImage && (
          <div className="subject-form__current">
            <img src={existingImageUrl} alt="Current image" className="subject-form__preview" />
            <button type="button" className="text-button text-button--danger" onClick={() => setRemoveImage(true)}>
              Remove current image
            </button>
          </div>
        )}
        {existingImageUrl && removeImage && (
          <p className="form-hint">
            The current image will be removed when you save.{' '}
            <button type="button" className="text-button" onClick={() => setRemoveImage(false)}>
              Undo
            </button>
          </p>
        )}

        <div className="form-field">
          <label htmlFor="subject-image">{existingImageUrl ? 'Replace with a new image' : 'Image file'}</label>
          <input id="subject-image" type="file" accept="image/*" onChange={handleImageChange} />
        </div>
        {previewUrl && <img src={previewUrl} alt="Preview of the chosen image" className="subject-form__preview" />}

        <div className="form-field">
          <label htmlFor="subject-alt">Image description (alt text)</label>
          <input
            id="subject-alt"
            type="text"
            placeholder="e.g. SCP-022 in its containment cell"
            value={values.imageAlt}
            onChange={(e) => setField('imageAlt', e.target.value)}
          />
          <span className="form-hint">Read aloud by screen readers in place of the image.</span>
        </div>
      </fieldset>

      {/* ---------- Required sections ---------- */}
      <ParagraphListField
        id="containment"
        label="Special Containment Procedures"
        paragraphs={values.containmentProcedures}
        onChange={(list) => setField('containmentProcedures', list)}
        maxLength={SUBJECT_LIMITS.body}
        required
      />
      <ParagraphListField
        id="description"
        label="Description"
        paragraphs={values.description}
        onChange={(list) => setField('description', list)}
        maxLength={SUBJECT_LIMITS.body}
        required
      />

      {/* ---------- Optional sections, folded away until needed ---------- */}
      <details className="form-optional">
        <summary>Optional sections: reference, notes, chronology, appendix, field report</summary>

        <ParagraphListField
          id="reference"
          label="Reference"
          paragraphs={values.reference}
          onChange={(list) => setField('reference', list)}
          maxLength={SUBJECT_LIMITS.body}
        />
        <ParagraphListField
          id="notes"
          label="Additional Notes"
          paragraphs={values.additionalNotes}
          onChange={(list) => setField('additionalNotes', list)}
          maxLength={SUBJECT_LIMITS.body}
        />
        <ChronologyField
          entries={values.chronology}
          onChange={(list) => setField('chronology', list)}
          maxLength={SUBJECT_LIMITS.body}
        />

        <fieldset className="form-section">
          <legend>Appendix</legend>
          <p className="form-hint">Fill in both fields to include an appendix, or leave both empty.</p>
          <div className="form-field">
            <label htmlFor="appendix-title">Appendix title</label>
            <input
              id="appendix-title"
              type="text"
              placeholder="e.g. Appendix A"
              maxLength={SUBJECT_LIMITS.title}
              value={values.appendix.title}
              onChange={(e) => setField('appendix', { ...values.appendix, title: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="appendix-body">Appendix text</label>
            <textarea
              id="appendix-body"
              rows={4}
              maxLength={SUBJECT_LIMITS.body}
              value={values.appendix.body}
              onChange={(e) => setField('appendix', { ...values.appendix, body: e.target.value })}
            />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Field Report</legend>
          <p className="form-hint">Give the report a title and at least one entry, or leave it all empty.</p>
          <div className="form-field">
            <label htmlFor="report-title">Report title</label>
            <input
              id="report-title"
              type="text"
              maxLength={SUBJECT_LIMITS.title}
              value={values.fieldReport.title}
              onChange={(e) => setField('fieldReport', { ...values.fieldReport, title: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="report-intro">Introduction (optional)</label>
            <textarea
              id="report-intro"
              rows={2}
              maxLength={SUBJECT_LIMITS.body}
              value={values.fieldReport.intro}
              onChange={(e) => setField('fieldReport', { ...values.fieldReport, intro: e.target.value })}
            />
          </div>
          <ParagraphListField
            id="report-entry"
            label="Report entries"
            paragraphs={values.fieldReport.entries}
            onChange={(list) => setField('fieldReport', { ...values.fieldReport, entries: list })}
            maxLength={SUBJECT_LIMITS.body}
          />
        </fieldset>
      </details>

      {/* ---------- Problems and actions ---------- */}
      {problems.length > 0 && (
        <div className="form-message form-message--error" role="alert">
          <p>Please fix the following before saving:</p>
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        {/* Disabled while saving so it can't be submitted twice. */}
        <button type="submit" className="form-button" disabled={saving}>
          {saving ? 'Filing…' : submitLabel}
        </button>
        <button type="button" className="form-button form-button--secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// Trim every text value and drop anything left empty, so blank paragraphs or
// half-filled optional sections aren't saved.
function cleanValues(values) {
  const paragraphs = (list) => list.map((p) => p.trim()).filter(Boolean);

  const appendix = {
    title: values.appendix.title.trim(),
    body: values.appendix.body.trim(),
  };
  const fieldReport = {
    title: values.fieldReport.title.trim(),
    intro: values.fieldReport.intro.trim(),
    entries: paragraphs(values.fieldReport.entries),
  };

  return {
    item: values.item.trim(),
    // <select> values are always text ("1"); the database column is a number.
    // An empty choice becomes null, which validate() reports.
    objectClassId: values.objectClassId ? Number(values.objectClassId) : null,
    summary: values.summary.trim(),
    imageAlt: values.imageAlt.trim(),
    containmentProcedures: paragraphs(values.containmentProcedures),
    description: paragraphs(values.description),
    reference: paragraphs(values.reference),
    additionalNotes: paragraphs(values.additionalNotes),
    chronology: values.chronology
      .map((entry) => ({ date: entry.date, text: entry.text.trim() }))
      .filter((entry) => entry.date || entry.text),
    // null = this optional section is not included
    appendix: appendix.title || appendix.body ? appendix : null,
    fieldReport: fieldReport.title || fieldReport.intro || fieldReport.entries.length ? fieldReport : null,
  };
}

// Check the cleaned values and return a list of problems (empty = valid).
// The database checks the same rules again, so this is for clear messages,
// not security.
function validate(values, imageFile) {
  const problems = [];

  if (!ITEM_PATTERN.test(values.item)) {
    problems.push('Item number must be SCP- followed by 3 or 4 digits, e.g. SCP-022.');
  }
  if (!values.objectClassId) problems.push('Choose an object class.');
  if (!values.summary) problems.push('Write a summary.');
  if (values.containmentProcedures.length === 0) {
    problems.push('Write at least one paragraph of Special Containment Procedures.');
  }
  if (values.description.length === 0) problems.push('Write at least one paragraph of Description.');

  if (values.chronology.some((entry) => !entry.date || !entry.text)) {
    problems.push('Every chronology event needs both a date and details (or remove the event).');
  }
  if (values.appendix && (!values.appendix.title || !values.appendix.body)) {
    problems.push('The appendix needs both a title and text (or leave both empty).');
  }
  if (values.fieldReport && (!values.fieldReport.title || values.fieldReport.entries.length === 0)) {
    problems.push('The field report needs a title and at least one entry (or leave it all empty).');
  }

  if (imageFile) {
    if (!imageFile.type.startsWith('image/')) problems.push('The chosen file is not an image.');
    if (imageFile.size > MAX_IMAGE_BYTES) {
      problems.push(`The image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
    }
  }

  return problems;
}

export default SubjectForm;
