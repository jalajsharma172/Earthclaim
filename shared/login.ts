
import { supabase } from "./supabaseClient.js";

/**
 * Service for handling Browser LocalStorage operations
 */
export const BrowserStorageService = {
    getUserFromStorage: async () => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('user_data');
        return stored ? JSON.parse(stored) : null;
    },

    saveUserToStorage: async (data: any) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('user_data', JSON.stringify(data));
    },

    clearUserFromStorage: async () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('user_data');
    }
};

/**
 * Service for handling Supabase User Authentication/Registration
 * NOTE: Table name inferred as 'Users' or similar. 
 * Since schema is not fully visible, this is a provisional implementation.
 */
export const SuprabaseStorageService = async (username?: string, useremail?: string, walletAddress?: string) => {

    // 1. Determine query filter based on available inputs
    let query = supabase.from('login').select('*');

    if (walletAddress) {
        query = query.eq('wallet_address', walletAddress);
    } else if (useremail) {
        query = query.eq('useremail', useremail);
    } else {
        console.error("No identity provided for login");
        return { error: "No identity provided" };
    }

    const { data: existingUser, error: fetchError } = await query.single();



    if (existingUser) {
        return existingUser;
    }

    // 2. Create new user if not found
    const { data: newUser, error: insertError } = await supabase
        .from('login')
        .insert([{
            username: username || (walletAddress ? `User-${walletAddress.slice(0, 6)}` : 'Unknown'),
            useremail: useremail || null,
            wallet_address: walletAddress || null
        }])
        .select()
        .single();

    if (insertError) {
        console.error("Supabase insert error:", insertError);
        return { username, useremail, walletAddress, id: 'fallback-id-insert-error' };
    }

    return newUser;
};
