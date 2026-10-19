// Shared Supabase client.
//
// Every component imports `supabase` from this file instead of creating its
// own client. One shared client means one auth session for the whole app and
// one place where the connection settings are read.
//
// The client is a wrapper around Supabase's auto-generated REST API: a call
// such as supabase.from('object_classes').select('*') is sent as an HTTP GET
// to <project-url>/rest/v1/object_classes?select=*
import { createClient } from '@supabase/supabase-js';

// Connection settings come from environment variables, not the source code:
// locally from the git-ignored .env file, and on Netlify from its
// environment settings. Vite only exposes variables prefixed with VITE_.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fail early with a clear message rather than a confusing network error
// later on. The usual cause is a missing .env file or a typo in a name.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase settings missing: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY ' +
      'in .env (see .env.example), then restart the dev server.'
  );
}

// The publishable key is safe to ship to the browser: it can only do what the
// database's Row Level Security policies allow.
export const supabase = createClient(supabaseUrl, supabaseKey);
