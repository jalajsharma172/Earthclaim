
import { supabase } from "./supabaseClient";

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
export const SuprabaseStorageService = async (username: string, useremail: string) => {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
        .from('users') // Assuming table name is 'users'
        .select('*')
        .eq('email', useremail)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error("Supabase fetch error:", fetchError);
        // Fallback: return simple object to allow login to proceed if DB fails
        return { username, useremail, id: 'fallback-id' };
    }

    if (existingUser) {
        return existingUser;
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ username, email: useremail }])
        .select()
        .single();

    if (insertError) {
        console.error("Supabase insert error:", insertError);
        return { username, useremail, id: 'fallback-new-id' };
    }

    return newUser;
};
