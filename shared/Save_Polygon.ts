import { supabase } from "@shared/supabaseClient";
 
export const savePolygon = async (username: string, polygonPoints: any[]) => {
  try { 
    const simplePolygon = polygonPoints.map(point => [point.lon, point.lat]);
    simplePolygon.push(simplePolygon[0]); 
     
    const { data: existingData, error: fetchError } = await supabase
      .from('UserPolygon')
      .select('Polygon')
      .eq('UserName', username)
      .single();

    let updatedPolygons = [simplePolygon]; // Start with new polygon
    
    if (existingData && existingData.Polygon) {
      // User exists, append to existing polygons
      updatedPolygons = [...existingData.Polygon, simplePolygon];
    }

    // Upsert (update or insert) the record
    const { data, error } = await supabase
      .from('UserPolygon')
      .upsert({
        UserName: username,
        Polygon: updatedPolygons
      })
      .select();

    if (error) throw error;
    
    console.log('Polygon added successfully. Total polygons:', updatedPolygons.length);
    return { data, success: true };
    
  } catch (error) {
    console.error('Error adding polygon:', error);
    return { data: null, success: false, error };
  }
};