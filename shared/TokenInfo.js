import { supabase } from "@shared/supabaseClient.js";
export async function TokenInfo(recipient, tokenURI, tokenId) {
    try {
        const { data, error } = await supabase
            .from('TokenInfo')
            .insert([
            { recipient: recipient, tokenURI: tokenURI, tokenId: tokenId },
        ])
            .select();
        if (error)
            throw error;
        return {
            success: true,
            data: data
        };
    }
    catch (error) {
        console.error('Error getting user path:', error);
        return {
            success: false,
            data: error
        };
    }
}
