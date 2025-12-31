// shared/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // FAIL FAST — this is REQUIRED in serverless
        throw new Error(
            'Supabase environment variables missing. ' +
            'Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel.'
        );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
}
