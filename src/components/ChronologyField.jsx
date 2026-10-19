// The Chronology section: a list of dated events, each with a date picker
// and a text box. Used by SubjectForm.
//
//   entries   array of { date: 'YYYY-MM-DD', text } (controlled by the parent)
//   onChange  called with the new array
function ChronologyField({ entries, onChange, maxLength }) {
  function updateEntry(index, field, value) {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  }

  function addEntry() {
    onChange([...entries, { date: '', text: '' }]);
  }

  function removeEntry(index) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="form-section">
      <legend>Chronology</legend>
      <p className="form-hint">Dated events, shown in the order entered. Dates display as DD/MM/YYYY.</p>

      {entries.map((entry, index) => (
        <div className="chronology-field" key={index}>
          <div className="form-field">
            <label htmlFor={`chronology-date-${index}`}>Event {index + 1} date</label>
            {/* The browser's date picker; its value is always YYYY-MM-DD. */}
            <input
              id={`chronology-date-${index}`}
              type="date"
              value={entry.date}
              onChange={(e) => updateEntry(index, 'date', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`chronology-text-${index}`}>Event {index + 1} details</label>
            <textarea
              id={`chronology-text-${index}`}
              rows={2}
              maxLength={maxLength}
              value={entry.text}
              onChange={(e) => updateEntry(index, 'text', e.target.value)}
            />
          </div>
          <button type="button" className="text-button text-button--danger" onClick={() => removeEntry(index)}>
            Remove event {index + 1}
          </button>
        </div>
      ))}

      <button type="button" className="text-button" onClick={addEntry}>
        + Add event
      </button>
    </fieldset>
  );
}

export default ChronologyField;
