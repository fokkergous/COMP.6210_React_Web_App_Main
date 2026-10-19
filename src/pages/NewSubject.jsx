import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../context/SubjectsContext';
import { fetchObjectClasses } from '../lib/subjects';
import { createSubject, EMPTY_SUBJECT } from '../lib/subjectWrites';
import SubjectForm from '../components/SubjectForm';
import FileStatus from '../components/FileStatus';
import ClearanceRequired from '../components/ClearanceRequired';

// Roles allowed to create subjects. Matches the RLS insert policy on
// scp_subjects in schema.sql; the database enforces it either way.
const CAN_CREATE = ['editor', 'admin'];

// The "New file" page (/new): the subject form for editors and admins.
function NewSubject() {
  const { user, role, loading: authLoading } = useAuth();
  const { subjects, reload: reloadList } = useSubjects();
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

  if (authLoading) {
    return <FileStatus type="loading" message="Checking clearance…" />;
  }

  // Not allowed: explain why instead of showing a form that would fail.
  if (!user || !CAN_CREATE.includes(role)) {
    return (
      <ClearanceRequired
        loggedIn={Boolean(user)}
        reason="Only editors and administrators can open new files. Contact an administrator if you need editor access."
      />
    );
  }

  if (classesError) {
    return <FileStatus type="error" message="The form could not be prepared. Reload the page to try again." />;
  }

  // Suggest the next unused item number (one above the highest), e.g. SCP-022.
  const highest = Math.max(0, ...subjects.map((s) => Number(s.item.replace('SCP-', ''))));
  const initialValues = { ...EMPTY_SUBJECT, item: `SCP-${String(highest + 1).padStart(3, '0')}` };

  async function handleSubmit(values, image) {
    const slug = await createSubject(values, image.file, user.id);
    // Refresh the shared list so Home and the File index include the new file.
    reloadList();
    navigate(`/${slug}`);
  }

  return (
    <article className="dossier">
      <Link to="/" className="dossier__back">← Back to index</Link>
      <header className="dossier__header">
        <div className="dossier__heading">
          <p className="eyebrow">Open a new file</p>
          <h1>New Subject</h1>
        </div>
      </header>

      {objectClasses.length === 0 ? (
        <FileStatus type="loading" message="Preparing form…" />
      ) : (
        <SubjectForm
          initialValues={initialValues}
          objectClasses={objectClasses}
          submitLabel="File subject"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
        />
      )}
    </article>
  );
}

export default NewSubject;
