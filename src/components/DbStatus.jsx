import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Shows whether the app can reach the Supabase database, as an item in the
// header's clearance bar. It reads the object_classes lookup table: a small,
// public table, so a successful read proves the URL, key and Row Level
// Security read policy all work.
function DbStatus() {
  // 'connecting' until the request finishes, then 'online' or 'offline'.
  const [status, setStatus] = useState('connecting');
  const [classCount, setClassCount] = useState(0);

  useEffect(() => {
    // Ignore the result if the component unmounts before the request ends
    // (for example React StrictMode's double mount in development).
    let cancelled = false;

    async function checkConnection() {
      const { data, error } = await supabase.from('object_classes').select('name');
      if (cancelled) return;

      if (error) {
        console.error('Database connection check failed:', error.message);
        setStatus('offline');
      } else {
        setClassCount(data.length);
        setStatus('online');
      }
    }

    checkConnection();
    return () => {
      cancelled = true;
    };
  }, []);

  const label = {
    connecting: 'Database link: connecting…',
    online: `Database link: established · ${classCount} object classes`,
    offline: 'Database link: offline',
  }[status];

  // role="status" makes screen readers announce the change when it updates.
  return (
    <span className={`db-status db-status--${status}`} role="status">
      <span className="db-status__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default DbStatus;
