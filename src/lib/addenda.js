// Writing addenda to Supabase: create, update and delete.
//
// Who may do what is decided by the database's Row Level Security policies
// (schema.sql), not by this file:
//   insert  any logged-in user, as themselves
//   update  the addendum's author, or an admin
//   delete  the addendum's author, or an admin
//
// When RLS refuses an update or delete, Supabase does NOT return an error:
// the request succeeds but changes zero rows. So every write here asks for
// the affected rows back (.select()) and treats "no rows" as refused.
import { supabase } from './supabase';

// Must match the CHECK constraints on public.addenda in schema.sql.
export const ADDENDUM_LIMITS = { title: 120, body: 5000 };

const NOT_PERMITTED = 'You do not have permission to change this addendum.';

// Add an addendum to a subject. author_id is not sent: the database fills it
// in with the logged-in user's id (column default auth.uid()), and RLS
// rejects any attempt to file an addendum as someone else.
export async function addAddendum(subjectId, { title, body }) {
  const { data, error } = await supabase
    .from('addenda')
    .insert({ subject_id: subjectId, title, body })
    .select('id');

  if (error) throw error;
  return data[0];
}

// Change an addendum's title and text.
export async function updateAddendum(id, { title, body }) {
  const { data, error } = await supabase
    .from('addenda')
    .update({ title, body })
    .eq('id', id)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new Error(NOT_PERMITTED);
}

// Remove an addendum.
export async function deleteAddendum(id) {
  const { data, error } = await supabase
    .from('addenda')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new Error(NOT_PERMITTED);
}
