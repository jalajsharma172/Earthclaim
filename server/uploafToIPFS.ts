import axios from 'axios';

export async function uploadJsonToIPFS(metadata: unknown): Promise<string> {
  if (!metadata) {
    console.error('IPFS Error: metadata is undefined');
    return 'Error';
  }
  const key1=process.env.VITE_PINATA_API_KEY;
  const key2=process.env.VITE_PINATA_SECRET_API_KEY;
  if(!key1 || !key2 ){
    console.error('IPFS Error: .env not accesable . ');
    return 'Error';
  }
  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: key1,
          pinata_secret_api_key: key2,
        },
      }
    );

    return res.data.IpfsHash as string;
  } catch (err) {
    console.log('IPFS Error:', err.response?.data || err);
    return 'Error';
  }
}

