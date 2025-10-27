import { ethers } from "ethers";
import CLAIM_EARTH_NFT_ABI  from "@client/contractsData/NFT.json";

const CONTRACT_ADDRESS = "0x7e9d4593d864f84cf34AA786A8C190F68002832F";

export default async function fetchTokenURI(tokenId) {
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI.abi, provider);
  const tokenURI = await contract.tokenURI(tokenId);
  
  // send to backend
//   await fetch("/api/send-msg", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ tokenURI, tokenId }),
//   });
return tokenURI;
}
