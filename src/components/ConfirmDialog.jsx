import { useEffect, useRef } from 'react';

// A yes/no confirmation box for actions that can't be undone (deleting).
//
//   <ConfirmDialog
//     open={isOpen}
//     title="Delete addendum?"
//     message="This cannot be undone."
//     confirmLabel="Delete"
//     busy={deleting}
//     onConfirm={handleDelete}
//     onCancel={() => setIsOpen(false)}
//   />
//
// Built on the browser's <dialog> element: showModal() dims the page, keeps
// keyboard focus inside the box, and closes it on Escape, so these
// accessibility basics don't need to be written by hand.
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  // Keep the real dialog in step with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      // Escape closes the dialog by itself; tell the parent so its state matches.
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <p className="eyebrow">Confirmation required</p>
      <h2 id="confirm-dialog-title" className="confirm-dialog__title">{title}</h2>
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        {/* Cancel first and focused by default, so Enter doesn't delete by accident. */}
        <button type="button" className="form-button form-button--secondary" onClick={onCancel} disabled={busy} autoFocus>
          Cancel
        </button>
        <button type="button" className="form-button form-button--danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
