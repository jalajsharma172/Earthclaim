import { supabase } from "@shared/supabaseClient";

export async function UpdateMintedPolygon(username: string,nft:any ) {
  try {
    if(!nft|| !username){
        return{
            succes:false,
            message: 'No UserName Found at DB'     
        }
    }
    
    console.log("Shared Side - UpdateMintedPolygon ");
    console.log(nft);
    
        const { data, error } = await supabase
        .from('UserPolygon')
        .update({ Polygon: nft })
        .eq('UserName',username)
        .select();
        console.log(data);
        if(error)return { error, success: false, message: 'Nope PolygonUpdate is not done' };
   return { success: true, message: 'Yes PolygonUpdated done' };
    
  } catch (error) {
    // console.error('Error adding polygon:', error);
    return { error, success: false, message: 'Nope PolygonUpdate is not done' };
  }
}