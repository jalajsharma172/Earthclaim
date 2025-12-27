import { supabase } from "./supabaseClient.js";
import { data } from "react-router";

export async function getTokenId(tokenURI: string) {
  try {
    let { data, error } = await supabase
      .from('TokenInfo')
      .select('tokenId')
      .eq('tokenURI', tokenURI)
      .single();
    if (data) console.log("token id is ", data);


    if (error) throw error;

    return {
      tokenID: data,
      success: true
    };
  } catch (error) {
    console.error('Error getting user path:', error);
    return {
      data: error,
      success: false
    };
  }
}