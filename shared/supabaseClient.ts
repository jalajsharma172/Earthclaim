import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization pattern
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Use environment variables provided by Vercel or .env
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_KEY are set in environment variables."
        );
    }

    console.log("[Supabase] Initializing new client connection...");
    supabaseInstance = createClient(supabaseUrl, supabaseKey);

    return supabaseInstance;
}

// Deprecated: For backward compatibility during refactor, but triggers lazy load immediately if accessed.
// We keep this temporarily if needed, but ideally we remove it.
// Given the instruction to "Replace all direct imports", we will NOT export generic 'supabase' constant
// to force compilation errors where updates are needed.



