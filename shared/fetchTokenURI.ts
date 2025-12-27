import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const CLAIM_EARTH_NFT_ABI = require("./NFT.json");

const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || "0xYourContractAddressHere";

export default async function fetchTokenURI(tokenId: string, customProvider?: ethers.Provider) {
    let provider: ethers.Provider;

    if (customProvider) {
        provider = customProvider;
    } else {
        // Fallback to RPC URL if no window/provider
        provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI.abi, provider);
    const tokenURI = await contract.tokenURI(tokenId);
    return tokenURI;
}
