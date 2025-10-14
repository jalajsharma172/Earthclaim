import { supabase } from "@shared/supabaseClient";
 
export const savePolygon = async (username: string, IPFS:string,Area:string) => {
  try { 


    const PolygonIPFS={
      IPFS:IPFS,
      Area:Area
    }


    // Upsert (update or insert) the record
    const { data, error } = await supabase
      .from('UserPolygon')
      .upsert({
        UserName: username,
        Polygon: PolygonIPFS
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