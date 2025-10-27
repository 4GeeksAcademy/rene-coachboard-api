// Simple Express.js server for /api/invite endpoint
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });


const app = express();
app.use(bodyParser.json());
// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

app.post('/api/invite', async (req, res) => {
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Invite server running on port ${PORT}`);
});
