// Splits paragraph text on [DATA EXPUNGED] markers so they can be rendered
// as permanently inked out redaction bars, matching the source SCP
// documents' redaction convention.
function Redacted({ text }) {
  const parts = text.split(/(\[DATA REDACTED\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part === '[DATA REDACTED]' ? (
          <span className="redacted" key={i}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default Redacted;
