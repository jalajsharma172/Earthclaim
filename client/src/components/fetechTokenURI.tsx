import { ethers } from "ethers";
import CLAIM_EARTH_NFT_ABI  from "@client/contractsData/NFT.json";

const CONTRACT_ADDRESS = "0x7e9d4593d864f84cf34AA786A8C190F68002832F";

export default async function fetchTokenURI(tokenId: string, customProvider?: ethers.Provider) {
  let provider: ethers.Provider;
  
  if (customProvider) {
    provider = customProvider;
  } else if (typeof window !== 'undefined' && window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    // Fallback to RPC URL if no window/provider
    provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI.abi, provider);
  const tokenURI = await contract.tokenURI(tokenId);
  return tokenURI;
}
