import { getSupabaseClient } from './supabaseClient.js';

interface WeatherReportData {
  username: string;
  weatherreport: string;
}

export async function saveWeatherReport(
  username: string,
  weatherreport: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Input validation
    if (!username || !weatherreport) {
      return {
        success: false,
        message: 'Missing required parameters: username or weatherreport'
      };
    }

    // First, check if the username exists
    const supabase = getSupabaseClient();
    const { data: existingData, error: searchError } = await supabase
      .from('WeatherReport')
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
        .from('WeatherReport')
        .update({
          weatherreport: weatherreport
        })
        .eq('username', username)
        .select();
    } else {
      // Insert new record
      result = await supabase
        .from('WeatherReport')
        .insert([{
          username: username,
          weatherreport: weatherreport
        }])
        .select();
    }

    if (result.error) {
      console.error('Error saving weather report:', result.error);
      return {
        success: false,
        message: `Failed to save weather report: ${result.error.message}`
      };
    }

    return {
      success: true,
      message: existingData ? 'Weather report updated successfully' : 'Weather report saved successfully'
    };

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`
    };
  }
}
