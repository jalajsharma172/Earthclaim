import { useState, type ChangeEvent, type MouseEvent } from 'react'
import axios from 'axios'
import dotenv from "dotenv";

dotenv.config(); // Load .env file
export async function uploadJsonToIPFS(metadata: unknown): Promise<string> {
    try{
  const res = await axios({
    method: 'post',
    url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    data: metadata,
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
      pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
    },
  });

  
  const hash = res.data.IpfsHash as string;
  return hash as string;
    }catch(err){
        return 'Error';
    }
}
