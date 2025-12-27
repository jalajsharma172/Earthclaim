import { supabase } from './supabaseClient.js';
/**
 * Fetch all rows from SaveLocation (single call). Use only for small tables.
 */
export async function getAllSaveLocations() {
    const { data, error } = await supabase.from('SaveLocation').select('*');
    if (error) {
        console.error('Error fetching SaveLocation rows:', error);
        throw error;
    }
    return data ?? [];
}
/**
 * Fetch rows from SaveLocation using range pagination.
 * Use this for large tables. rangeStart and rangeEnd are inclusive indexes.
 */
export async function fetchSaveLocationsPaged(rangeStart = 0, rangeEnd = 999) {
    const { data, error } = await supabase
        .from('SaveLocation')
        .select('*')
        .range(rangeStart, rangeEnd);
    if (error) {
        console.error(`Error fetching SaveLocation range ${rangeStart}-${rangeEnd}:`, error);
        throw error;
    }
    return data ?? [];
}
/**
 * Count rows in SaveLocation. Useful to decide pagination window.
 */
export async function countSaveLocations() {
    const { count, error } = await supabase
        .from('SaveLocation')
        .select('id', { count: 'exact', head: true });
    if (error) {
        // If count isn't supported or error, log and return 0
        console.error('Error counting SaveLocation rows:', error);
        return 0;
    }
    return count ?? 0;
}
// Usage notes:
// - For small tables you can call getAllSaveLocations()
// - For large tables prefer fetchSaveLocationsPaged(rangeStart, rangeEnd) and iterate pages
