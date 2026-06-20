import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gyargxxfsuzhepumcynf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXJneHhmc3V6aGVwdW1jeW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjYwMDgsImV4cCI6MjA5NzQwMjAwOH0.sCi7OYWdabfeaARnhMMhZH-KzmNCOyI0Le-T50WrCtk";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXJneHhmc3V6aGVwdW1jeW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyNjAwOCwiZXhwIjoyMDk3NDAyMDA4fQ.Bo80woTgULEf5cKirqEqV-vokA9ItKfeyTIu8ka0zfQ";

// Standard client for public queries (uses Anon Key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only client for administrative/auth tasks (uses Service Role Key to bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
