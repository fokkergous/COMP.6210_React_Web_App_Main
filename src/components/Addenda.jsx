import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addAddendum, updateAddendum, deleteAddendum } from '../lib/addenda';
import { formatTimestamp } from '../lib/subjects';
import Redacted from './Redacted';
import AddendumForm from './AddendumForm';
import ConfirmDialog from './ConfirmDialog';

// The Addenda section of a dossier: lists the addenda and lets logged-in
// users add their own, and edit or delete the ones they wrote.
//
// The buttons shown here mirror the database's Row Level Security rules, so
// users only see actions that will work. RLS still enforces the rules even
// if someone bypasses the UI.
//
//   subjectId  the subject's numeric database id (for new addenda)
//   addenda    array from lib/subjects.js, or null if there are none
//   onChanged  async; re-fetches the subject after a successful change
function Addenda({ subjectId, addenda, onChanged }) {
  const { user, role } = useAuth();
  const location = useLocation();

  // Which form is open: 'new', the id of the addendum being edited, or null.
  const [editing, setEditing] = useState(null);
  // The addendum waiting for delete confirmation, or null.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const list = addenda ?? [];

  // Visitors only see this section when there is something to read.
  if (list.length === 0 && !user) return null;

  // Authors may change their own addenda; admins may change any.
  // Original (seeded) addenda have no author, so only admins can change them.
  function canModify(addendum) {
    return Boolean(user) && (role === 'admin' || addendum.authorId === user.id);
  }

  function showNotice(message) {
    setError('');
    setNotice(message);
  }

  async function handleAdd(values) {
    await addAddendum(subjectId, values);
    await onChanged();
    setEditing(null);
    showNotice('Addendum filed.');
  }

  async function handleEdit(id, values) {
    await updateAddendum(id, values);
    await onChanged();
    setEditing(null);
    showNotice('Addendum updated.');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAddendum(pendingDelete.id);
      await onChanged();
      showNotice('Addendum deleted.');
    } catch (err) {
      setNotice('');
      setError(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  function openForm(which) {
    setNotice('');
    setError('');
    setEditing(which);
  }

  return (
    <section className="dossier__section" aria-labelledby="addenda-heading">
      <h2 id="addenda-heading">Addenda</h2>

      {notice && (
        <p className="form-message form-message--notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}

      {list.length === 0 && <p className="addenda__empty">No addenda have been filed for this subject.</p>}

      {list.map((add) =>
        editing === add.id ? (
          <div className="addendum" key={add.id}>
            <AddendumForm
              initialTitle={add.title}
              initialBody={add.text}
              submitLabel="Save changes"
              onSubmit={(values) => handleEdit(add.id, values)}
              onCancel={() => setEditing(null)}
            />
          </div>
        ) : (
          <div className="addendum" key={add.id}>
            <h3>{add.title}</h3>
            <p className="addendum__byline">
              {/* Original addenda came with the file: no author or filing date. */}
              {add.authorId
                ? `Filed by ${add.authorName ?? 'unknown personnel'} · ${formatTimestamp(add.createdAt)}${add.edited ? ' · edited' : ''}`
                : 'Original file'}
            </p>
            <p><Redacted text={add.text} /></p>

            {canModify(add) && (
              <div className="addendum__actions">
                <button type="button" className="text-button" onClick={() => openForm(add.id)}>
                  Edit
                </button>
                <button type="button" className="text-button text-button--danger" onClick={() => setPendingDelete(add)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Adding: logged-in users get a button that opens the form;
          visitors get a link to log in, which returns them here afterwards. */}
      {user ? (
        editing === 'new' ? (
          <div className="addendum addendum--new">
            <AddendumForm
              submitLabel="File addendum"
              onSubmit={handleAdd}
              onCancel={() => setEditing(null)}
            />
          </div>
        ) : (
          <button type="button" className="form-button" onClick={() => openForm('new')}>
            + Add addendum
          </button>
        )
      ) : (
        <p className="addenda__login">
          <Link to="/login" state={{ from: location.pathname }}>Log in</Link> to add an addendum.
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete addendum?"
        message={pendingDelete ? `"${pendingDelete.title}" will be permanently removed from this file.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

export default Addenda;
