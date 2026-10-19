import { useState } from 'react';
import { ADDENDUM_LIMITS } from '../lib/addenda';

// Form for writing or editing an addendum (title + text).
// Used both for "Add addendum" and, pre-filled, for editing one.
//
//   onSubmit({ title, body })  async; throw an Error to show its message
//   onCancel()                 close the form without saving
function AddendumForm({ initialTitle = '', initialBody = '', submitLabel, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    // Stop the browser reloading the page; React handles the form instead.
    event.preventDefault();
    setError('');

    // required / maxLength on the inputs already stop empty or too-long
    // values; this also rejects text that is only spaces.
    if (title.trim() === '' || body.trim() === '') {
      setError('Please enter both a title and the addendum text.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      // On success the parent closes this form, so there is nothing to reset.
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="addendum-form" onSubmit={handleSubmit}>
      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="addendum-title">Title</label>
        <input
          id="addendum-title"
          type="text"
          required
          maxLength={ADDENDUM_LIMITS.title}
          placeholder="e.g. Addendum 017-02"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="addendum-body">Addendum text</label>
        <textarea
          id="addendum-body"
          required
          rows={6}
          maxLength={ADDENDUM_LIMITS.body}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <span className="form-hint">
          {body.length} / {ADDENDUM_LIMITS.body} characters. Write [DATA REDACTED] to show a redaction bar.
        </span>
      </div>

      <div className="addendum-form__actions">
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

export default AddendumForm;
