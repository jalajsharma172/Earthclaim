
 
import { supabase } from "@shared/supabaseClient";

export async function getPolygonJSON(username: string) {
  try {

    // table name is 'UserPolygons' 
    // Columns are id,UserName,Polygon.
    if(!username){
      return{
        succes:false,
        message: 'No UserName Found at DB'     
    }
    }

    console.log("polygon fetching ffile : ",username);
    

    let { data: existingData, error } = await supabase
      .from('UserPolygon')
      .select('Polygon')  // Fixed: added quotes around column name
      .eq('UserName', username)
      .single();  // Added single() to get one record

    
  
 
    if (existingData) {  
      return { 
        success: true, 
        message: 'Got polygons from Db', 
        data: existingData  // Access the Polygon property

      };       
    } else {      
      return { 
        success: false, 
        message: 'No Polygons Exist', 
        error: error 
      };
    }
  } catch (error) {
    // console.error('Error adding polygon:', error);
    return { error, success: false, message: 'Failed to save polygon' };
  }
}