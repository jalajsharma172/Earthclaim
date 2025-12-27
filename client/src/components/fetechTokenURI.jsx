import { ethers } from "ethers";
import CLAIM_EARTH_NFT_ABI from "@client/contractsData/NFT.json";
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || "0xYourContractAddressHere";
export default async function fetchTokenURI(tokenId, customProvider) {
    let provider;
    if (customProvider) {
        provider = customProvider;
    }
    else {
        // Fallback to RPC URL if no window/provider
        provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI.abi, provider);
    const tokenURI = await contract.tokenURI(tokenId);
    return tokenURI;
}
