import { supabase } from './supabaseClient.js';
import { fetchSaveLocationsPaged } from './getAllSaveLocations.js';
/**
 * Process rows in SaveLocation using pagination and concurrency control.
 * - processor receives a row and should return an update object (fields to update) or null to skip.
 * - keyField is used to identify rows when updating (defaults to 'username').
 */
export async function processAndUpdateAllLocations(processor, opts = {}) {
    const keyField = opts.keyField ?? 'username';
    const pageSize = opts.pageSize ?? 500;
    const concurrency = opts.concurrency ?? 5;
    let processed = 0;
    let updated = 0;
    const errors = [];
    // paginate by ranges
    let start = 0;
    while (true) {
        const end = start + pageSize - 1;
        let rows = [];
        try {
            rows = await fetchSaveLocationsPaged(start, end);
        }
        catch (err) {
            errors.push({ stage: 'fetch', start, end, error: err });
            break;
        }
        if (!rows || rows.length === 0)
            break;
        // Process chunk with concurrency
        for (let i = 0; i < rows.length; i += concurrency) {
            const chunk = rows.slice(i, i + concurrency);
            await Promise.all(chunk.map(async (row) => {
                try {
                    processed++;
                    const updateObj = await processor(row);
                    if (updateObj && Object.keys(updateObj).length > 0) {
                        const selectorValue = row[keyField];
                        if (selectorValue === undefined) {
                            throw new Error(`Key field "${keyField}" not found on row`);
                        }
                        const { error } = await supabase
                            .from('SaveLocation')
                            .update(updateObj)
                            .eq(keyField, selectorValue);
                        if (error)
                            throw error;
                        updated++;
                    }
                }
                catch (err) {
                    errors.push({ row, error: err });
                }
            }));
        }
        // advance window
        if (rows.length < pageSize)
            break; // last page
        start += pageSize;
    }
    return { success: errors.length === 0, processed, updated, errors };
}
// Usage example (server route):
// import { processAndUpdateAllLocations } from './shared/processSaveLocations';
// await processAndUpdateAllLocations(async (row) => { return { last_seen_at: new Date().toISOString() } });
