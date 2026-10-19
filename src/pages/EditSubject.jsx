import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../context/SubjectsContext';
import { useSubject } from '../hooks/useSubject';
import { fetchObjectClasses } from '../lib/subjects';
import { canManageSubject, dossierToFormValues, updateSubject } from '../lib/subjectWrites';
import SubjectForm from '../components/SubjectForm';
import FileStatus from '../components/FileStatus';
import ClearanceRequired from '../components/ClearanceRequired';
import NotFound from './NotFound';

// The edit page (/scp-xxx/edit): the subject form, pre-filled with the
// current file, for the subject's owner or an admin.
function EditSubject() {
  const { id } = useParams();
  const { user, role, loading: authLoading } = useAuth();
  const { reload: reloadList } = useSubjects();
  const { subject, loading, error, reload } = useSubject(id);
  const navigate = useNavigate();

  const [objectClasses, setObjectClasses] = useState([]);
  const [classesError, setClassesError] = useState(null);

  // Load the class drop-down options once.
  useEffect(() => {
    let cancelled = false;
    fetchObjectClasses()
      .then((list) => {
        if (!cancelled) setObjectClasses(list);
      })
      .catch((err) => {
        console.error('Could not load object classes:', err.message);
        if (!cancelled) setClassesError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading || loading) {
    return <FileStatus type="loading" message={`Retrieving file ${id.toUpperCase()}…`} />;
  }
  if (error) {
    return (
      <FileStatus
        type="error"
        message="This file could not be retrieved. Check your connection and try again."
        onRetry={reload}
      />
    );
  }
  if (!subject) return <NotFound />;

  // Only the owning editor or an admin may edit (same rule as the database).
  if (!canManageSubject(user, role, subject.ownerId)) {
    return (
      <ClearanceRequired
        loggedIn={Boolean(user)}
        reason="Only this file's owner or an administrator can edit it."
      />
    );
  }

  if (classesError) {
    return <FileStatus type="error" message="The form could not be prepared. Reload the page to try again." />;
  }

  async function handleSubmit(values, image) {
    const slug = await updateSubject(subject, values, image, user.id);
    // Refresh the shared list: the item number, class or summary may have
    // changed, and Home and the File index show them.
    reloadList();
    // The slug changes if the item number changed (/scp-022 -> /scp-030).
    navigate(`/${slug}`);
  }

  return (
    <article className="dossier">
      <Link to={`/${subject.id}`} className="dossier__back">← Back to {subject.item}</Link>
      <header className="dossier__header">
        <div className="dossier__heading">
          <p className="eyebrow">Amend file</p>
          <h1>Edit {subject.item}</h1>
        </div>
      </header>

      {objectClasses.length === 0 ? (
        <FileStatus type="loading" message="Preparing form…" />
      ) : (
        <SubjectForm
          initialValues={dossierToFormValues(subject)}
          existingImageUrl={subject.image}
          objectClasses={objectClasses}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/${subject.id}`)}
        />
      )}
    </article>
  );
}

export default EditSubject;
