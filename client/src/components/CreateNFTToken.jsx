import React, { useState } from 'react';
import { ethers } from "ethers";
import ClaimEarthNFT from "./abi.json"; // Your contract's ABI
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const MintButton = ({ ipfsURI }) => {
    const [isMinting, setIsMinting] = useState(false);
    const mintLandNFT = async () => {
        // 1. Check if MetaMask is installed
        if (!window.ethereum) {
            alert("Please install MetaMask to use this feature!");
            return;
        }
        try {
            setIsMinting(true);
            // 2. Connect to the Ethereum provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            // Request account access if not already connected
            await provider.send("eth_requestAccounts", []);
            // 3. Get the signer (the user's wallet)
            const signer = await provider.getSigner();
            // 4. Create an instance of the contract
            const contract = new ethers.Contract(contractAddress, ClaimEarthNFT, signer);
            // 5. Call the mintNFT function on the smart contract
            console.log(`Minting NFT with URI: ${ipfsURI}`);
            const userAddress = await signer.getAddress();
            const tx = await contract.mintNFT(userAddress, ipfsURI);
            // Wait for the transaction to be confirmed on the blockchain
            await tx.wait();
            alert("✅ NFT Minted successfully! Check your wallet on OpenSea or Etherscan.");
        }
        catch (error) {
            if (error.code === 4001) {
                alert("❌ Transaction rejected by the user.");
            }
            else {
                alert("❌ Minting failed. Check the console for more details.");
            }
            console.error("An error occurred during minting:", error);
        }
        finally {
            setIsMinting(false);
        }
    };
    return (<button onClick={mintLandNFT} disabled={isMinting} style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: isMinting ? 'not-allowed' : 'pointer',
            backgroundColor: isMinting ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px'
        }}>
      {isMinting ? 'Minting...' : 'Mint Your Land NFT'}
    </button>);
};
export default MintButton;
