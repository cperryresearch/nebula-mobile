import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ebcdoemghrtxgnipppqk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY2RvZW1naHJ0eGduaXBwcHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzQxNDgsImV4cCI6MjA4NjYxMDE0OH0.sUqNDQXSk458uyooVnlCSuUQGuPXhxeiEdltgjxGjQ0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("SUPABASE_URL =", SUPABASE_URL);
console.log("SUPABASE_KEY_PREFIX =", SUPABASE_ANON_KEY.slice(0, 20));