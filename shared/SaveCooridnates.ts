import { supabase } from './supabaseClient.js';

export async function saveLocationToSupabase(
  username: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Input validation
    if (!username || !latitude || !longitude) {
      return {
        success: false,
        message: 'Missing required parameters: username, latitude, or longitude'
      };
    }

    // First, check if the username exists
    const { data: existingData, error: searchError } = await supabase
      .from('SaveLocation')
      .select()
      .eq('username', username)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error searching for existing user:', searchError);
      return {
        success: false,
        message: `Error checking existing user: ${searchError.message}`
      };
    }

    let result;
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('SaveLocation')
        .update({
          latitude: latitude,
          longitude: longitude
        })
        .eq('username', username)
        .select();
    } else {
      // Insert new record
      result = await supabase
        .from('SaveLocation')
        .insert([{
          username: username,
          latitude: latitude,
          longitude: longitude
        }])
        .select();
    }

    if (result.error) {
      console.error('Error saving location:', result.error);
      return {
        success: false,
        message: `Failed to save location: ${result.error.message}`
      };
    }

    return {
      success: true,
      message: existingData ? 'Location updated successfully' : 'Location saved successfully'
    };

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`
    };
  }
}