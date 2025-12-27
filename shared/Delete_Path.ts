import { supabase } from "@shared/supabaseClient.js";

// Clear path array (set to empty array but keep record)
export async function clearUserPath(username: string) {
  try {

    const { error } = await supabase
      .from('UserPath')
      .delete()
      .eq('UserName', username)

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error clearing user path:', error);
    return { success: false };
  }
}

