import { supabase } from "@shared/supabaseClient";

export interface UserData {
  username: string
  useremail: string 
}
 


// Simple localStorage version (replace ChromeStorageService with this)
export class BrowserStorageService {

  private static readonly STORAGE_KEY = 'currentUser';
//user data to browser storage
  // Save 
  static async saveUserToStorage(userData: UserData): Promise<boolean> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        userData,
      })); 
      return true;
    } catch (error) {
      console.error('Error saving user to browser storage:', error);
      return false;
    }
  }
  // Get 
  static async getUserFromStorage(): Promise<UserData | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        console.log( userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user from browser storage:', error);
      return null;
    }
  }


  // Get only useremail
  static async getUserEmailFromStorage(): Promise<string | null> {
    try {
      const userData = await this.getUserFromStorage();
      return userData?.useremail || null;
    } catch (error) {
      console.error('Error getting useremail from storage:', error);
      return null;
    }
  }

  // Clear
  static async clearUserFromStorage(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('User data cleared from browser storage');
      return true;
    } catch (error) {
      console.error('Error clearing user from storage:', error);
      return false;
    }
  }

  // Check exist
  static async hasUserInStorage(): Promise<boolean> {
    const user = await this.getUserFromStorage();
    return user !== null;
  }
}

export async function SuprabaseStorageService(username: string, useremail: string): Promise<{success: boolean; message: string; user?: any}> {
  try {
    if (!username || username.trim() === '') {
      return { success: false, message: 'Username is required' };
    }

    const cleanUsername = username.trim();
    const cleanEmail = useremail?.trim() || null;

    // Check existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('Login')
      .select('*')
      .eq('UserName', cleanUsername)
      .single();

    if (existingUser) {
      return { 
        success: true, 
        message: `Welcome back ${existingUser.UserName}!`, 
        user: existingUser 
      }; 
    }

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('Login')
      .insert([{ UserName: cleanUsername, UserEmail: cleanEmail }])
      .select()
      .single();

    if (insertError) throw insertError;

    return { 
      success: true, 
      message: `New user ${cleanUsername} created successfully!`, 
      user: newUser 
    };

  } catch (error: any) {
    const errorMessage = error.code === 'PGRST116' 
      ? `New user ${username} will be created` 
      : `Database error: ${error.message}`;
    
    console.error('Supabase service error:', errorMessage);
    return { success: false, message: errorMessage };
  }

}

