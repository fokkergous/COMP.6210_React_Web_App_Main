// Themed loading / error message for data fetched from Supabase.
//
//   <FileStatus type="loading" message="Retrieving catalogue…" />
//   <FileStatus type="error" message="…" onRetry={reload} />
//
// role="status" / role="alert" make screen readers announce the message.
function FileStatus({ type, message, onRetry }) {
  const isError = type === 'error';

  return (
    <div className={`file-status file-status--${type}`} role={isError ? 'alert' : 'status'}>
      <p className="eyebrow">{isError ? 'Transmission failed' : 'Retrieving file'}</p>
      <p className="file-status__message">{message}</p>
      {isError && onRetry && (
        <button type="button" className="file-status__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default FileStatus;
