// ============================================================
//  Supabase Client Configuration
//  Replace the placeholder values with your real credentials.
//  Get them from: https://supabase.com → Project → Settings → API
// ============================================================

const SUPABASE_URL = 'https://qtxyuwuwjwweatqhcmko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eHl1d3V3and3ZWF0cWhjbWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzM4MjIsImV4cCI6MjA5MzkwOTgyMn0.vDBH1mqg0m6Ku6z90GT962EOx_EVYQZWX7BTvX5JE_Y'

const { createClient } = window.supabase;
window.db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
