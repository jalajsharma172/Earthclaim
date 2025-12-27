

import { supabase } from "@shared/supabaseClient.js";

export async function getFreePolygonsFromWalletAddress(walletAddress: string) {
  try {

    if (!walletAddress) {
      return {
        success: false,
        message: 'No walletAddress Found at DB'
      }
    }

    console.log("polygon fetching ffile : ", walletAddress);


    let { data: FreePolygons, error } = await supabase
      .from('FreePolygons')
      .select('*')
      .eq('wallet', walletAddress);

    if (FreePolygons) {
      return {
        success: true,
        message: 'Got polygons from Db',
        data: FreePolygons

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

export async function getFreePolygon() {

  try {

    const { data, error } = await supabase
      .from('AviableFreePolygons')
      .select('*');


    if (error) {
      console.log('Error fetching free polygons:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.log('Exception fetching free polygons:', error);
    return [];
  }
}



export async function SaveFreePolygon(wallet: string, ip: string, coordinates: string[], name: string) {

  try {

    const { data, error } = await supabase
      .from('FreePolygons')
      .insert([
        { wallet: wallet, ip: ip, coordinates: coordinates, Name: name }
      ])
      .select()


    if (error) {
      console.log('Error fetching free polygons:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.log('Exception fetching free polygons:', error);
    return [];
  }
}
