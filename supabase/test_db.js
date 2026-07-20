const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing Supabase connection...');
  
  // 1. Fetch jobs
  const { data: jobs, error: jobsErr } = await supabase.from('jobs').select('*');
  if (jobsErr) {
    console.error('Error fetching jobs:', jobsErr);
  } else {
    console.log('Jobs data:', jobs);
  }

  // 2. Fetch roadmap_cache
  const { data: cache, error: cacheErr } = await supabase.from('roadmap_cache').select('*');
  if (cacheErr) {
    console.error('Error fetching roadmap_cache:', cacheErr);
  } else {
    console.log('roadmap_cache data:', cache);
  }
}

test();
