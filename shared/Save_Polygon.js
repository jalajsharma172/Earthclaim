import { supabase } from "./supabaseClient.js";
export async function savePolygon(username, polygonName, areaInSqMeters, IPFS) {
    try {
        // First check if username exists or not
        const { data: existingData, error: fetchError } = await supabase
            .from('UserPolygon') // Use correct table name from your comment
            .select('Polygon')
            .eq('UserName', username)
            .single();
        // Prepare the new polygon object with minted field
        const newPolygon = {
            Name: polygonName,
            Area: areaInSqMeters,
            IPFShashcode: IPFS,
            minted: false
        };
        if (fetchError) {
            // If user doesn't exist (error code PGRST116), create new record
            if (fetchError.code === 'PGRST116') {
                const { data, error } = await supabase
                    .from('UserPolygon') // Use correct table name
                    .insert({
                    UserName: username,
                    Polygon: [newPolygon]
                })
                    .select();
                if (error)
                    return { error, success: false, message: 'Failed to create new user and polygon' };
                else
                    return { data, success: true, message: 'New user and polygon created' };
            }
            else {
                throw fetchError;
            }
        }
        else {
            // User exists - update the existing Polygon array by adding new polygon
            const currentPolygons = existingData.Polygon || [];
            // Add new polygon to existing polygon array
            const updatedPolygons = [
                ...currentPolygons,
                newPolygon
            ];
            // Update the record with the new array
            const { data, error } = await supabase
                .from('UserPolygon') // Use correct table name
                .update({
                Polygon: updatedPolygons
                // Remove minted from here if it's a polygon-level property
            })
                .eq('UserName', username)
                .select();
            if (error)
                return { error, success: false, message: 'Polygon is not added to existing user' };
            else
                return { data, success: true, message: 'Polygon added to existing user' };
        }
    }
    catch (error) {
        console.error('Error adding polygon:', error);
        return { error, success: false, message: 'Failed to save polygon' };
    }
}
