// This is a Next.js API route. If you use Vite or another framework, adapt accordingly.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role required' });
  }
  // Invite user
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error) return res.status(500).json({ error: error.message });
  // Store profile
  const userId = data?.user?.id;
  if (!userId) return res.status(500).json({ error: 'User ID not returned from invite' });
  const { error: profileError } = await supabase.from('profiles').insert({ id: userId, email, role });
  if (profileError) return res.status(500).json({ error: profileError.message });
  return res.status(200).json({ success: true });
}
