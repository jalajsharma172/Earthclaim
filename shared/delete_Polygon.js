import { supabase } from "./supabaseClient.js";
export async function deletePolygon(username, polygonName) {
    try {
        // First, get the current user data
        const { data: existingData, error: fetchError } = await supabase
            .from('UserPolygon')
            .select('Polygon')
            .eq('UserName', username)
            .single();
        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return { success: false, message: 'User not found' };
            }
            else {
                throw fetchError;
            }
        }
        // Check if user has any polygons
        if (!existingData.Polygon || !Array.isArray(existingData.Polygon) || existingData.Polygon.length === 0) {
            return { success: false, message: 'No polygons found for this user' };
        }
        // Filter out the polygon with the matching name
        const updatedPolygons = existingData.Polygon.filter((polygon) => polygon.Name !== polygonName);
        // Check if any polygon was actually removed
        if (updatedPolygons.length === existingData.Polygon.length) {
            return { success: false, message: `Polygon with name "${polygonName}" not found` };
        }
        // Update the record with the filtered array
        const { data, error } = await supabase
            .from('UserPolygon')
            .update({
            Polygon: updatedPolygons
        })
            .eq('UserName', username)
            .select();
        if (error)
            throw error;
        return {
            success: true,
            message: `Polygon "${polygonName}" deleted successfully`,
            data
        };
    }
    catch (error) {
        console.error('Error deleting polygon:', error);
        return {
            success: false,
            message: `Failed to delete polygon: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
