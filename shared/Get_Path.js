import { supabase } from "@shared/supabaseClient.js";
export async function getUserPathByUsername(username) {
    try {
        let { data: UserPath, error } = await supabase
            .from('UserPath')
            .select('Path')
            .eq('UserName', username)
            .single(); // Use single() if you expect only one record per username
        if (error)
            throw error;
        return {
            data: UserPath?.Path,
            success: true
        };
    }
    catch (error) {
        console.error('Error getting user path:', error);
        return {
            data: error,
            success: false
        };
    }
}
