// A section made of any number of paragraphs (containment procedures,
// description, references, ...): one text box per paragraph, with buttons to
// add and remove paragraphs. Used by SubjectForm.
//
//   id          prefix for the text boxes' ids (unique on the page)
//   label       the section heading, e.g. "Description"
//   paragraphs  array of strings (controlled by the parent form)
//   onChange    called with the new array
//   required    at least one paragraph must stay
function ParagraphListField({ id, label, hint, paragraphs, onChange, required = false, maxLength }) {
  // A required section always keeps at least one box.
  const minimum = required ? 1 : 0;

  function updateParagraph(index, text) {
    onChange(paragraphs.map((p, i) => (i === index ? text : p)));
  }

  function addParagraph() {
    onChange([...paragraphs, '']);
  }

  function removeParagraph(index) {
    onChange(paragraphs.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="form-section">
      <legend>
        {label}
        {required && <span className="form-required"> · required</span>}
      </legend>
      {hint && <p className="form-hint">{hint}</p>}

      {paragraphs.map((text, index) => (
        // The text lives in the parent's state, so the index is a safe key.
        <div className="form-field" key={index}>
          <label htmlFor={`${id}-${index}`}>Paragraph {index + 1}</label>
          <textarea
            id={`${id}-${index}`}
            rows={4}
            maxLength={maxLength}
            required={required && index === 0}
            value={text}
            onChange={(e) => updateParagraph(index, e.target.value)}
          />
          {paragraphs.length > minimum && (
            <button
              type="button"
              className="text-button text-button--danger"
              onClick={() => removeParagraph(index)}
            >
              Remove paragraph {index + 1}
            </button>
          )}
        </div>
      ))}

      <button type="button" className="text-button" onClick={addParagraph}>
        + Add paragraph
      </button>
    </fieldset>
  );
}

export default ParagraphListField;
