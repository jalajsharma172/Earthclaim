import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization pattern
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Try to use environment variables first
    let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

    // Fallback to hardcoded credentials if env vars are not set
    // TODO: Set these as environment variables in Vercel for production
    if (!supabaseUrl || !supabaseKey) {
        console.warn("[Supabase] Environment variables not found, using hardcoded fallback credentials");
        supabaseUrl = 'https://ibzihlvnphmejtxlnieq.supabase.co';
        supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliemlobHZucGhtZWp0eGxuaWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTAwMDYsImV4cCI6MjA2OTc4NjAwNn0.iu2uq-vudrFomiIDLHOlIsFNP_9ohN9zU62bK2_TqVA';
    }

    console.log("[Supabase] Initializing new client connection...");
    supabaseInstance = createClient(supabaseUrl, supabaseKey);

    return supabaseInstance;
}

// Deprecated: For backward compatibility during refactor, but triggers lazy load immediately if accessed.
// We keep this temporarily if needed, but ideally we remove it.
// Given the instruction to "Replace all direct imports", we will NOT export generic 'supabase' constant



