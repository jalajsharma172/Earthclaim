import { supabase } from "@shared/supabaseClient";

export async function EventListner_MintedToken_Save(recipient: string, tokenURI: string, tokenId: number) {
    try {
        const { data, error } = await supabase
            .from('MintedToken')
            .insert([
                { recipient: recipient, tokenURI: tokenURI, tokenId: tokenId },
            ])
            .select()


        if (error) {
            return {
                success: false,
                error: error
            };
        }
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Error getting user path:', error);
        return {
            success: false,
            error: error
        };
    }
}