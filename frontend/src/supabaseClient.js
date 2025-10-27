import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);

if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is missing');
if (!SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is missing');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Add REST endpoint for direct fetch calls
export const restUrl = `${SUPABASE_URL}/rest/v1`;