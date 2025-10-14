// import { supabase } from "@shared/supabaseClient";

// export const addPolygonToUser = async (username: string, polygonPoints: PathPoint[]) => {
//   try {
//     // Convert to simple format
//     const simplePolygon = polygonPoints.map(point => [point.lon, point.lat]);
//     simplePolygon.push(simplePolygon[0]); // Close polygon
    
//     // First, get existing polygons for this user
//     const { data: existingData, error: fetchError } = await supabase
//       .from('user_polygons')
//       .select('polygon')
//       .eq('username', username)
//       .single();

//     let updatedPolygons = [simplePolygon]; // Start with new polygon
    
//     if (existingData && existingData.polygon) {
//       // User exists, append to existing polygons
//       updatedPolygons = [...existingData.polygon, simplePolygon];
//     }

//     // Upsert (update or insert) the record
//     const { data, error } = await supabase
//       .from('user_polygons')
//       .upsert({
//         username: username,
//         polygon: updatedPolygons
//       })
//       .select();

//     if (error) throw error;
    
//     console.log('Polygon added successfully. Total polygons:', updatedPolygons.length);
//     return { data, success: true };
    
//   } catch (error) {
//     console.error('Error adding polygon:', error);
//     return { data: null, success: false, error };
//   }
// };