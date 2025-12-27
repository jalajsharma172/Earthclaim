import { supabase } from "@shared/supabaseClient.js";

export async function save_AddressWithUserName(username: string, UserAddress: string) {
  try {
    console.log("Upserting username:", username, "with Address:", UserAddress);










    let { data: existingData, error } = await supabase
      .from('Address')
      .select('Address')  // Fixed: added quotes around column name
      .eq('Address', UserAddress)
      .single();  // Added single() to get one record



    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }
    if (existingData) {   // If exist ---> Update


    } else {       // If not exist ---> Add it 
      const { data, error } = await supabase
        .from('Address')
        .insert([
          { Address: UserAddress, "UserName": username },
        ])
        .select()
    }


    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("✅ Data upserted successfully. Username:", username, "  Address : ", UserAddress);

    return {
      success: true,
      message: 'Address + UserName Saved',
    };
  } catch (error) {
    console.error("Error upserting user path:", error);
    return { success: false };
  }
}

