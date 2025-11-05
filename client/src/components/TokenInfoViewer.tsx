import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from "wouter";
import { address } from "../contractsData/Marketplace-address.json";
import { Contract } from 'ethers';
import { ethers, BrowserProvider } from 'ethers';
interface TokenInfoViewerProps {
  nft: Contract | null;
}
const getSigner = async (): Promise<ethers.Signer | null> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      return await provider.getSigner();
    } catch (error) {
      console.error('User denied account access:', error);
      return null;
    }
  } else {
    console.error('MetaMask not installed');
    return null;
  }
};
export const TokenInfoViewer: React.FC<TokenInfoViewerProps> = ({ nft }) => {
  const [approveStatus, setApproveStatus] = useState<string>("");
  const [isWebpageOpen, setIsWebpageOpen] = useState<boolean>(false);
  const [webpageUrl, setWebpageUrl] = useState<string>("");
  const [inputValue1, setInputValue1] = useState<string>(address || "");
  const [inputValue2, setInputValue2] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  
  // Wouter hooks
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/token-info/:ipfsHash");

  // For now, using empty defaults since wouter doesn't have location.state
  const {
    tokenName,
    ipfsHash,
    signer,
    transactionHash,
    area,
    minted,
    username,
  } = {};

  const ipfsHashParam = params?.ipfsHash || ipfsHash;

  console.log("NFT Contract:", nft);
  console.log("Token Name:", tokenName);
  console.log("IPFS Hash:", ipfsHash);
  console.log("IPFS Hash Param:", ipfsHashParam);

  const [tokenId, setTokenId] = useState<number | null>(null);
  
  useEffect(() => {
    console.log("TokenInfoViewer mounted");
    const fetchTokenID = async () => {
      try {
        const resp = await axios.post('/api/get-id', { tokenURI: ipfsHashParam });
        const data = resp?.data;
        setTokenId(data?.tokenID?.tokenId ?? null);
        setInputValue2(data?.tokenID?.tokenId?.toString() ?? "");
        if (data?.success === true) {
          console.log("Token ID fetched successfully:", data.tokenID);
        } else {
          console.error("Failed to fetch Token ID:", data?.message ?? 'Unknown error');
        }
      } catch (err) {
        console.error("Error fetching Token ID:", err);
      }
    };

    if (ipfsHashParam) {
      fetchTokenID();
    }
  }, [ipfsHashParam]);

  // Open IPFS page on the right side
  const openIPFSViewer = () => {
    if (ipfsHashParam) {
      setWebpageUrl(`https://ipfs.io/ipfs/${ipfsHashParam}`);
      setIsWebpageOpen(true);
    }
  };

  // Open custom webpage
  const openCustomWebpage = (url: string) => {
    setWebpageUrl(url);
    setIsWebpageOpen(true);
  };

  const closeWebpage = () => {
    setIsWebpageOpen(false);
    setWebpageUrl("");
  };

  // Open Etherscan with transaction hash
  const openEtherscan = () => {
    if (transactionHash) {
      openCustomWebpage(`https://sepolia.etherscan.io/tx/${transactionHash}`);
    } else {
      openCustomWebpage('https://sepolia.etherscan.io');
    }
  };

  // Navigate back using wouter
  const navigateToDashboard = () => {
    setLocation('/dashboard');
  };

  // Handle approve function - similar to commented version
  const handleApprove = async () => {
    if (!nft || !tokenId) {
      setApproveStatus("NFT contract or Token ID not available");
      return;
    }

    try {
      setIsApproving(true);
      setApproveStatus("Approving...");
    console.log("NFT:", nft);
    console.log("Token ID:", tokenId);
    console.log("NFT contract address is ",inputValue1);
      
      const tx = await nft.approve(inputValue1, tokenId);
      await tx.wait();
      setApproveStatus("Approved successfully!");
    } catch (error: any) {
      console.error("Approval error:", error);
      setApproveStatus(
        error?.message || "Approval failed. Please check your wallet connection."
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content - Left Side */}
      <div className={`${isWebpageOpen ? 'w-1/2' : 'w-full'} container mx-auto p-6 overflow-auto`}>
        <button
          onClick={navigateToDashboard}
          className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Token Information</h1>

          {/* Display NFT contract status */}
          {nft ? (
            <div className="mb-4 p-3 bg-green-100 rounded-lg">
              <h3 className="font-semibold text-green-700">✓ NFT Contract Connected</h3>
              <p className="text-green-600 text-sm">Contract address: {nft.address}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-red-100 rounded-lg">
              <h3 className="font-semibold text-red-700">✗ NFT Contract Not Available</h3>
              <p className="text-red-600 text-sm">Please connect your wallet first</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Token Name:</h3>
              <p className="text-gray-900">{tokenName || 'Not available'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">IPFS Hash:</h3>
              <p className="text-gray-900 break-all">{ipfsHashParam || 'Not available'}</p>

              <h3 className="font-semibold text-gray-700">Token ID:</h3>
              <p className="text-gray-900 break-all">{tokenId || 'Not available'}</p>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={openIPFSViewer}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Open IPFS on Right Side
                </button>
                
                <a
                  href={`https://ipfs.io/ipfs/${ipfsHashParam || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Open in New Tab
                </a>
              </div>
            </div>

            {/* Transaction Hash Section */}
            {transactionHash && (
              <div>
                <h3 className="font-semibold text-gray-700">Transaction Hash:</h3>
                <p className="text-gray-900 break-all text-sm font-mono mb-2">{transactionHash}</p>
                <button
                  onClick={openEtherscan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  View on Etherscan
                </button>
              </div>
            )}

            {/* Quick Links Section */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Quick Links:</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={openEtherscan}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  {transactionHash ? 'Etherscan (Tx)' : 'Etherscan'}
                </button>
                <button
                  onClick={() => openCustomWebpage("https://opensea.io")}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  OpenSea
                </button>
                <button
                  onClick={() => openCustomWebpage("https://ipfs.io")}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                >
                  IPFS Gateway
                </button>
              </div>
            </div>

            {/* Additional Information Sections */}
            {area && (
              <div>
                <h3 className="font-semibold text-gray-700">Area:</h3>
                <p className="text-gray-900">{area}</p>
              </div>
            )}

            {minted !== undefined && (
              <div>
                <h3 className="font-semibold text-gray-700">Minted:</h3>
                <p className="text-gray-900">{minted ? 'Yes' : 'No'}</p>
              </div>
            )}

            {username && (
              <div>
                <h3 className="font-semibold text-gray-700">Username:</h3>
                <p className="text-gray-900">{username}</p>
              </div>
            )}

            {/* Approve Section with Input Boxes - Using the commented version structure */}
            {nft && (
              <div className="mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400"
                    onClick={handleApprove}
                    disabled={!nft || !tokenId || isApproving}
                  >
                    {isApproving ? "Approving..." : "Approve"}
                  </button>
                  
                  {/* Input Boxes for Address and TokenId */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={inputValue1}
                        onChange={(e) => setInputValue1(e.target.value)}
                        placeholder="Marketplace Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="text-xs text-gray-500 mt-1">Marketplace Contract Address</div>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={inputValue2}
                        onChange={(e) => setInputValue2(e.target.value)}
                        placeholder="Token ID"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled
                      />
                      <div className="text-xs text-gray-500 mt-1">Token ID (Auto-filled)</div>
                    </div>
                  </div>
                </div>
                
                {approveStatus && (
                  <div className={`mt-2 text-sm ${
                    approveStatus.includes("successfully") ? "text-green-600" : 
                    approveStatus.includes("error") || approveStatus.includes("failed") ? "text-red-600" : 
                    "text-gray-700"
                  }`}>
                    {approveStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webpage Viewer - Right Side */}
      {isWebpageOpen && (
        <div className="w-1/2 border-l border-gray-300 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
            <span className="font-semibold text-sm truncate">{webpageUrl}</span>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(webpageUrl, '_blank')}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              >
                Open in New Tab
              </button>
              <button
                onClick={closeWebpage}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1">
            <iframe
              src={webpageUrl}
              className="w-full h-full border-0"
              title="External Webpage"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      )}
    </div>
  );
};
