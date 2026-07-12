import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    const { data, error } = await supabase
      .from('person_skill_assessments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching person_skill_assessments row:', error);
      return;
    }

    console.log('Sample row from person_skill_assessments table:', data);

    if (data && data.length > 0) {
      console.log('Available columns in person_skill_assessments table:', Object.keys(data[0]));
    } else {
      console.log('person_skill_assessments table is empty or could not fetch keys.');
      
      // Let's do another query using RPC or SELECT to query columns if empty
      const { data: cols, error: colsErr } = await supabase
        .rpc('get_columns_of_assessments'); // Check if RPC exists, otherwise we'll run query
      console.log('RPC columns:', cols, colsErr);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
