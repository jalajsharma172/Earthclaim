import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { getSupabaseClient } from "../shared/supabaseClient.js";

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log("Testing Supabase Connection...");
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('users').select('*').limit(1);

        if (error) {
            console.error("Supabase Test Error:", error);
            return res.status(500).json({ success: false, error: error });
        }

        console.log("Supabase Test Success:", data);
        return res.status(200).json({ success: true, data: data });

    } catch (err) {
        console.error("Supabase Test Exception:", err);
        return res.status(500).json({
            success: false,
            message: "Exception connecting to Supabase",
            error: err instanceof Error ? err.message : String(err)
        });
    }
}

export default allowCors(handler);
