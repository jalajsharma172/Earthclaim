import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from "wouter";
const marketplaceaddress = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
import { ethers, BrowserProvider } from 'ethers';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
import { abi } from "../contractsData/NFT.json";
const getSigner = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new BrowserProvider(window.ethereum);
            return await provider.getSigner();
        }
        catch (error) {
            console.error('User denied account access:', error);
            return null;
        }
    }
    else {
        console.error('MetaMask not installed');
        return null;
    }
};
export const TokenInfoViewer = ({ nft }) => {
    const [signer, setSigner] = useState(null);
    const [approveStatus, setApproveStatus] = useState("");
    const [isWebpageOpen, setIsWebpageOpen] = useState(false);
    const [webpageUrl, setWebpageUrl] = useState("");
    const [inputValue1, setInputValue1] = useState(marketplaceaddress || "");
    const [inputValue2, setInputValue2] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState("");
    const [approvalHash, setApprovalHash] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [newnft, setnewnft] = useState(null);
    // Initialize ethers provider
    const [provider, setProvider] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    // Wouter hooks
    const [location, setLocation] = useLocation();
    const [match, params] = useRoute("/token-info/:ipfsHash");
    // For now, using empty defaults since wouter doesn't have location.state
    const { tokenName, ipfsHash, transactionHash, area, minted, username, } = {};
    const ipfsHashParam = params?.ipfsHash || ipfsHash;
    console.log("NFT Contract:", nft);
    console.log("Token Name:", tokenName);
    console.log("IPFS Hash:", ipfsHash);
    console.log("IPFS Hash Param:", ipfsHashParam);
    const [tokenId, setTokenId] = useState(null);
    // Initialize wallet connection
    const initializeWallet = async () => {
        if (typeof window.ethereum === "undefined") {
            setError("Please install MetaMask!");
            return;
        }
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const currentProvider = new ethers.BrowserProvider(window.ethereum);
            const currentSigner = await currentProvider.getSigner();
            //connect with NFT contract address
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, currentSigner);
            setnewnft(contract);
            setWalletAddress(accounts[0]);
            setProvider(currentProvider);
            setSigner(currentSigner);
            console.log("Wallet initialized:", accounts[0]);
            return currentSigner;
        }
        catch (err) {
            console.error("Error initializing wallet:", err);
            setError(err.message || "Failed to connect wallet");
            return null;
        }
    };
    useEffect(() => {
        console.log("TokenInfoViewer mounted");
        initializeWallet();
        const fetchTokenID = async () => {
            try {
                const resp = await axios.post('/api/get-id', { tokenURI: ipfsHashParam });
                const data = resp?.data;
                setTokenId(data?.tokenID?.tokenId ?? null);
                setInputValue2(data?.tokenID?.tokenId?.toString() ?? "");
                if (data?.success === true) {
                    console.log("Token ID fetched successfully:", data.tokenID);
                }
                else {
                    console.error("Failed to fetch Token ID:", data?.message ?? 'Unknown error');
                }
            }
            catch (err) {
                console.error("Error fetching Token ID:", err);
            }
        };
        if (ipfsHashParam) {
            fetchTokenID();
        }
    }, [ipfsHashParam]);
    // Connect wallet function
    const connectWallet = async () => {
        setIsConnecting(true);
        setError("");
        try {
            const walletSigner = await getSigner();
            setSigner(walletSigner);
            if (walletSigner) {
                console.log("Wallet connected successfully:", walletSigner.address);
            }
        }
        catch (err) {
            console.error("Failed to connect wallet:", err);
            setError(err.message || "Failed to connect wallet");
        }
        finally {
            setIsConnecting(false);
        }
    };
    // Open IPFS page on the right side
    const openIPFSViewer = () => {
        if (ipfsHashParam) {
            setWebpageUrl(`https://ipfs.io/ipfs/${ipfsHashParam}`);
            setIsWebpageOpen(true);
        }
    };
    // Open custom webpage
    const openCustomWebpage = (url) => {
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
        }
        else {
            openCustomWebpage('https://sepolia.etherscan.io');
        }
    };
    // Navigate back using wouter
    const navigateToDashboard = () => {
        setLocation('/dashboard');
    };
    // Enhanced error decoding
    const decodeError = (errorData) => {
        const errorMap = {
            '0xa9fbf51f': 'Not owner or not approved',
            '0x48f5c3ed': 'Caller is not owner nor approved',
            '0xce704c88': 'ERC721: approve caller is not owner nor approved for all',
            '0xdfc0338d': 'ERC721: invalid token ID',
            '0x5c4c2c41': 'Token does not exist',
        };
        const selector = errorData.slice(0, 10);
        return errorMap[selector] || `Contract error: ${selector}`;
    };
    // Handle approve function - now includes wallet connection
    const handleApprove = async () => {
        // First, ensure wallet is connected
        if (!signer) {
            await connectWallet();
            if (!signer) {
                setError("Please connect your wallet to approve");
                return;
            }
        }
        if (!nft || !tokenId) {
            setError("NFT contract or Token ID not available");
            return;
        }
        setIsApproving(true);
        setError("");
        setApproveStatus("Starting approval process...");
        setApprovalHash("");
        try {
            console.log("=== DEBUG INFO ===");
            console.log("NFT Contract Address:", nft.address);
            console.log("Token ID:", tokenId);
            console.log("Marketplace Address:", inputValue1);
            console.log("Signer Address:", signer.address);
            console.log("=================");
            // Input validation
            if (!inputValue1 || !ethers.isAddress(inputValue1)) {
                throw new Error("Invalid marketplace address");
            }
            // Step 1: Check token ownership
            setApproveStatus("Checking token ownership...");
            console.log("Checking token ownership...");
            try {
                const owner = await nft.ownerOf(tokenId);
                console.log("✅ Token owner:", owner);
                console.log("✅ Current signer:", signer.address);
                if (owner.toLowerCase() !== signer.address.toLowerCase()) {
                    throw new Error(`You are not the owner of this token. Actual owner: ${owner}`);
                }
                console.log("✅ Ownership verified - you are the owner");
            }
            catch (ownerError) {
                console.error("❌ Owner check failed:", ownerError);
                if (ownerError.message?.includes("nonexistent token")) {
                    throw new Error(`Token ID ${tokenId} does not exist`);
                }
                throw ownerError;
            }
            // Step 2: Check current approval
            setApproveStatus("Checking current approval status...");
            console.log("Checking current approval...");
            try {
                const currentApproved = await nft.getApproved(tokenId);
                console.log("✅ Current approved address:", currentApproved);
                if (currentApproved.toLowerCase() === "0xE4795aF39739779F31CAa5714B9760f773c7d46e") {
                    setApproveStatus("✅ NFT is already approved for this marketplace!");
                    setIsApproving(false);
                    return;
                }
            }
            catch (error) {
                console.log("ℹ️ Could not check current approval, continuing...");
            }
            // Step 3: Estimate gas to see if transaction would succeed
            setApproveStatus("Estimating gas...");
            console.log("Estimating gas...");
            try {
                const estimatedGas = await nft.approve.estimateGas(inputValue1, tokenId);
                console.log("✅ Gas estimation successful:", estimatedGas.toString());
            }
            catch (gasError) {
                console.error("❌ Gas estimation failed:", gasError);
                throw new Error(`Transaction would fail: ${gasError.message}`);
            }
            // Step 4: Execute the approval
            setApproveStatus("Sending approval transaction...");
            console.log("Sending transaction...");
            const tx = await nft.approve(inputValue1, tokenId);
            console.log("✅ Transaction sent:", tx.hash);
            setApprovalHash(tx.hash);
            setApproveStatus("Waiting for transaction confirmation...");
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed:", receipt);
            if (receipt.status === 1) {
                setApproveStatus("✅ NFT approved successfully!");
                console.log("✅ NFT approved successfully!");
            }
            else {
                throw new Error("Transaction failed on chain");
            }
        }
        catch (err) {
            console.error("❌ Error in handleApprove:", err);
            // Enhanced error decoding
            if (err.data) {
                console.log("Error data:", err.data);
                const errorMessage = decodeError(err.data);
                setError(`Smart contract error: ${errorMessage}`);
            }
            else if (err.code === "ACTION_REJECTED") {
                setError("Transaction was rejected by user");
            }
            else if (err.code === "INSUFFICIENT_FUNDS") {
                setError("Insufficient funds for transaction");
            }
            else if (err.message?.includes("not the owner")) {
                setError(err.message);
            }
            else if (err.message?.includes("nonexistent token")) {
                setError(`Token ID ${tokenId} does not exist`);
            }
            else {
                setError(err.message || "Failed to approve NFT");
            }
            setApproveStatus("");
        }
        finally {
            setIsApproving(false);
        }
    };
    return (<div className="flex h-screen">
      {/* Main Content - Left Side */}
      <div className={`${isWebpageOpen ? 'w-1/2' : 'w-full'} container mx-auto p-6 overflow-auto`}>
        <button onClick={navigateToDashboard} className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Token Information</h1>

          {/* Wallet Connection Status */}
          <div className="mb-4 p-3 bg-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-700">
              {isConnecting ? "🔄 Connecting Wallet..." :
            signer ? "✓ Wallet Connected" : "⚠ Connect Wallet to Approve"}
            </h3>
            {signer && (<p className="text-blue-600 text-sm">
                Connected address: {signer.address}
              </p>)}
            {!signer && !isConnecting && (<button onClick={connectWallet} disabled={isConnecting} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>)}
          </div>

          {/* Debug Panel */}
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Contract Debug Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>NFT Contract:</strong> {newnft ? newnft?.address : 'Not connected'}</p>
                <p><strong>Token ID:</strong> {tokenId || 'Loading...'}</p>
                <p><strong>Your Address:</strong> {signer?.address || 'Not connected'}</p>
              </div>
              <div>
                <p><strong>Marketplace Address:</strong> {inputValue1 || 'Not set'}</p>
                <p><strong>IPFS Hash:</strong> {ipfsHashParam || 'Not available'}</p>
                <p><strong>Network:</strong> Sepolia Testnet</p>
              </div>
            </div>
            
            {/* Test Buttons */}
            <div className="mt-3 flex gap-2">
              <button onClick={async () => {
            if (nft && tokenId) {
                try {
                    const owner = await nft.ownerOf(tokenId);
                    alert(`Token Owner: ${owner}\nYour Address: ${signer?.address}\nMatch: ${owner.toLowerCase() === signer?.address?.toLowerCase()}`);
                }
                catch (e) {
                    alert(`Error: ${e.message}`);
                }
            }
        }} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                Test Ownership
              </button>
              
              <button onClick={async () => {
            if (nft && tokenId) {
                try {
                    const approved = await nft.getApproved(tokenId);
                    alert(`Currently Approved: ${approved}`);
                }
                catch (e) {
                    alert(`Error: ${e.message}`);
                }
            }
        }} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
                Check Approval
              </button>
            </div>
          </div>

          {/* Display NFT contract status */}
          {nft ? (<div className="mb-4 p-3 bg-green-100 rounded-lg">
              <h3 className="font-semibold text-green-700">✓ NFT Contract Connected</h3>
              <p className="text-green-600 text-sm">Contract address: {nft.address}</p>
            </div>) : (<div className="mb-4 p-3 bg-red-100 rounded-lg">
              <h3 className="font-semibold text-red-700">✗ NFT Contract Not Available</h3>
              <p className="text-red-600 text-sm">Please connect your wallet first</p>
            </div>)}

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
                <button onClick={openIPFSViewer} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Open IPFS on Right Side
                </button>
                
                <a href={`https://ipfs.io/ipfs/${ipfsHashParam || ''}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                  Open in New Tab
                </a>
              </div>
            </div>

            {/* Transaction Hash Section */}
            {transactionHash && (<div>
                <h3 className="font-semibold text-gray-700">Transaction Hash:</h3>
                <p className="text-gray-900 break-all text-sm font-mono mb-2">{transactionHash}</p>
                <button onClick={openEtherscan} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  View on Etherscan
                </button>
              </div>)}

            {/* Quick Links Section */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Quick Links:</h3>
              <div className="flex gap-2 flex-wrap">
                <button onClick={openEtherscan} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">
                  {transactionHash ? 'Etherscan (Tx)' : 'Etherscan'}
                </button>
                <button onClick={() => openCustomWebpage("https://opensea.io")} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded">
                  OpenSea
                </button>
                <button onClick={() => openCustomWebpage("https://ipfs.io")} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded">
                  IPFS Gateway
                </button>
              </div>
            </div>

            {/* Additional Information Sections */}
            {area && (<div>
                <h3 className="font-semibold text-gray-700">Area:</h3>
                <p className="text-gray-900">{area}</p>
              </div>)}

            {minted !== undefined && (<div>
                <h3 className="font-semibold text-gray-700">Minted:</h3>
                <p className="text-gray-900">{minted ? 'Yes' : 'No'}</p>
              </div>)}

            {username && (<div>
                <h3 className="font-semibold text-gray-700">Username:</h3>
                <p className="text-gray-900">{username}</p>
              </div>)}

            {/* Approve Section with Input Boxes */}
            {nft && (<div className="mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400" onClick={handleApprove} disabled={!nft || !tokenId || isApproving || !signer}>
                    {isApproving ? "Approving..." : "Approve"}
                  </button>
                  
                  {/* Input Boxes for Address and TokenId */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input type="text" value={inputValue1} onChange={(e) => setInputValue1(e.target.value)} placeholder="Marketplace Address" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                      <div className="text-xs text-gray-500 mt-1">Marketplace Contract Address</div>
                    </div>
                    <div>
                      <input type="text" value={inputValue2} onChange={(e) => setInputValue2(e.target.value)} placeholder="Token ID" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled/>
                      <div className="text-xs text-gray-500 mt-1">Token ID (Auto-filled)</div>
                    </div>
                  </div>
                </div>
                
                {/* Status Messages */}
                {approveStatus && (<div className={`mt-2 text-sm ${approveStatus.includes("successfully") ? "text-green-600" :
                    approveStatus.includes("error") || approveStatus.includes("failed") ? "text-red-600" :
                        "text-blue-600"}`}>
                    {approveStatus}
                  </div>)}

                {/* Error Display */}
                {error && (<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700">
                      {error}
                    </p>
                  </div>)}

                {/* Transaction Hash Display */}
                {approvalHash && (<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-2">Transaction Details</h4>
                    <p className="text-blue-600 text-sm break-all font-mono">
                      {approvalHash}
                    </p>
                    <button onClick={() => window.open(`https://sepolia.etherscan.io/tx/${approvalHash}`, '_blank')} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                      View on Etherscan
                    </button>
                  </div>)}
              </div>)}
          </div>
        </div>
      </div>

      {/* Webpage Viewer - Right Side */}
      {isWebpageOpen && (<div className="w-1/2 border-l border-gray-300 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
            <span className="font-semibold text-sm truncate">{webpageUrl}</span>
            <div className="flex gap-2">
              <button onClick={() => window.open(webpageUrl, '_blank')} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                Open in New Tab
              </button>
              <button onClick={closeWebpage} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">
                Close
              </button>
            </div>
          </div>
          <div className="flex-1">
            <iframe src={webpageUrl} className="w-full h-full border-0" title="External Webpage" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"/>
          </div>
        </div>)}
    </div>);
};
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { useLocation, useRoute } from "wouter";
// import { address as marketplaceAddress } from "../contractsData/Marketplace-address.json";
// const marketplaceaddress = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
// import { Contract, ethers,BrowserProvider } from 'ethers';
// const [inputValue1,setInputValue1] = useState<string>(marketplaceaddress || "");
// const [inputValue2,setInputValue2] = useState<string>("");
// interface TokenInfoViewerProps {
//   nft: Contract | null;
// }
// const getSigner = async (): Promise<ethers.Signer | null> => {
//   if (typeof window.ethereum !== 'undefined') {
//     try {
//       // Request account access
//       await window.ethereum.request({ method: 'eth_requestAccounts' });
//       const provider = new BrowserProvider(window.ethereum);
//       return await provider.getSigner();
//     } catch (error) {
//       console.error('User denied account access:', error);
//       return null;
//     }
//   } else {
//     console.error('MetaMask not installed');
//     return null;
//   }
// };
// export const TokenInfoViewer: React.FC<TokenInfoViewerProps> = ({ nft }) => {
//   const [signer, setSigner] = useState<ethers.Signer | null>(null);
//   const [approveStatus, setApproveStatus] = useState<string>("");
//   const [isWebpageOpen, setIsWebpageOpen] = useState<boolean>(false);
//   const [webpageUrl, setWebpageUrl] = useState<string>("");
//   const [marketplaceAddress, setMarketplaceAddress] = useState<string>(marketplaceaddress || "");
//   const [tokenIdInput, setTokenIdInput] = useState<string>("");
//   const [isApproving, setIsApproving] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [approvalHash, setApprovalHash] = useState<string>("");
//   const [walletAddress, setWalletAddress] = useState<string>("");
//   // Initialize ethers provider
//   const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
//   const [isConnecting, setIsConnecting] = useState(false);
//   // Wouter hooks
//   const [location, setLocation] = useLocation();
//   const [match, params] = useRoute("/token-info/:ipfsHash");
//   // For now, using empty defaults since wouter doesn't have location.state
//   const {
//     tokenName,
//     ipfsHash,
//     transactionHash,
//     area,
//     minted,
//     username,
//   } = {};
//   const ipfsHashParam = params?.ipfsHash || ipfsHash;
//   console.log("NFT Contract:", nft);
//   console.log("Token Name:", tokenName);
//   console.log("IPFS Hash:", ipfsHash);
//   console.log("IPFS Hash Param:", ipfsHashParam);
//   const [tokenId, setTokenId] = useState<number | null>(null);
//   // Initialize wallet connection
//   const initializeWallet = async () => {
//     if (typeof window.ethereum === "undefined") {
//       setError("Please install MetaMask!");
//       return;
//     }
//     try {
//       // Request account access
//       const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//       const currentProvider = new ethers.BrowserProvider(window.ethereum);
//       const currentSigner = await currentProvider.getSigner();
//       setWalletAddress(accounts[0]);
//       setProvider(currentProvider);
//       setSigner(currentSigner);
//       console.log("Wallet initialized:", accounts[0]);
//       return currentSigner;
//     } catch (err: any) {
//       console.error("Error initializing wallet:", err);
//       setError(err.message || "Failed to connect wallet");
//       return null;
//     }
//   };
//   useEffect(() => {
//     console.log("TokenInfoViewer mounted");
//     initializeWallet();
//     const fetchTokenID = async () => {
//       try {
//         const resp = await axios.post('/api/get-id', { tokenURI: ipfsHashParam });
//         const data = resp?.data;
//         setTokenId(data?.tokenID?.tokenId ?? null);
//         setTokenIdInput(data?.tokenID?.tokenId?.toString() ?? "");
//         if (data?.success === true) {
//           console.log("Token ID fetched successfully:", data.tokenID);
//         } else {
//           console.error("Failed to fetch Token ID:", data?.message ?? 'Unknown error');
//         }
//       } catch (err) {
//         console.error("Error fetching Token ID:", err);
//       }
//     };    if (ipfsHashParam) {
//       fetchTokenID();
//     }
//   }, [ipfsHashParam]);
//   // Connect wallet function
//   const connectWallet = async () => {
//     setIsConnecting(true);
//     setError("");
//     try {
//       const walletSigner = await getSigner();
//       setSigner(walletSigner);
//       if (walletSigner) {
//         console.log("Wallet connected successfully:", walletSigner.address);
//       }
//     } catch (err: any) {
//       console.error("Failed to connect wallet:", err);
//       setError(err.message || "Failed to connect wallet");
//     } finally {
//       setIsConnecting(false);
//     }
//   };
//   // Open IPFS page on the right side
//   const openIPFSViewer = () => {
//     if (ipfsHashParam) {
//       setWebpageUrl(`https://ipfs.io/ipfs/${ipfsHashParam}`);
//       setIsWebpageOpen(true);
//     }
//   };
//   // Open custom webpage
//   const openCustomWebpage = (url: string) => {
//     setWebpageUrl(url);
//     setIsWebpageOpen(true);
//   };
//   const closeWebpage = () => {
//     setIsWebpageOpen(false);
//     setWebpageUrl("");
//   };
//   // Open Etherscan with transaction hash
//   const openEtherscan = () => {
//     if (transactionHash) {
//       openCustomWebpage(`https://sepolia.etherscan.io/tx/${transactionHash}`);
//     } else {
//       openCustomWebpage('https://sepolia.etherscan.io');
//     }
//   };
//   // Navigate back using wouter
//   const navigateToDashboard = () => {
//     setLocation('/dashboard');
//   };
//   // Handle approve function - now includes wallet connection
// const handleApprove = async () => {
//   // First, ensure wallet is connected
//   if (!signer) {
//     await connectWallet();
//     if (!signer) {
//       setError("Please connect your wallet to approve");
//       return;
//     }
//   }
//   if (!nft || !tokenId) {
//     setError("NFT contract or Token ID not available");
//     return;
//   }
//   setIsApproving(true);
//   setError("");
//   setApproveStatus("Starting approval process...");
//   setApprovalHash("");
//   try {
//     console.log("=== DEBUG INFO ===");
//     console.log("NFT Contract Address:", nft.address);
//     console.log("Token ID:", tokenId);
//     console.log("Marketplace Address:", inputValue1);
//     console.log("Signer Address:", signer.address);
//     console.log("=================");
//     // Input validation
//     if (!inputValue1 || !ethers.isAddress(inputValue1)) {
//       throw new Error("Invalid marketplace address");
//     }
//     // Step 1: Check token ownership
//     setApproveStatus("Checking token ownership...");
//     console.log("Checking token ownership...");
//     try {
//       const owner = await nft.ownerOf(tokenId);
//       console.log("✅ Token owner:", owner);
//       console.log("✅ Current signer:", signer.address);
//       if (owner.toLowerCase() !== signer.address.toLowerCase()) {
//         throw new Error(`You are not the owner of this token. Actual owner: ${owner}`);
//       }
//       console.log("✅ Ownership verified - you are the owner");
//     } catch (ownerError: any) {
//       console.error("❌ Owner check failed:", ownerError);
//       if (ownerError.message?.includes("nonexistent token")) {
//         throw new Error(`Token ID ${tokenId} does not exist`);
//       }
//       throw ownerError;
//     }
//     // Step 2: Check current approval
//     setApproveStatus("Checking current approval status...");
//     console.log("Checking current approval...");
//     try {
//       const currentApproved = await nft.getApproved(tokenId);
//       console.log("✅ Current approved address:", currentApproved);
//       if (currentApproved.toLowerCase() === inputValue1.toLowerCase()) {
//         setApproveStatus("✅ NFT is already approved for this marketplace!");
//         setIsApproving(false);
//         return;
//       }
//     } catch (error) {
//       console.log("ℹ️ Could not check current approval, continuing...");
//     }
//     // Step 3: Estimate gas to see if transaction would succeed
//     setApproveStatus("Estimating gas...");
//     console.log("Estimating gas...");
//     try {
//       const estimatedGas = await nft.approve.estimateGas(inputValue1, tokenId);
//       console.log("✅ Gas estimation successful:", estimatedGas.toString());
//     } catch (gasError: any) {
//       console.error("❌ Gas estimation failed:", gasError);
//       throw new Error(`Transaction would fail: ${gasError.message}`);
//     }
//     // Step 4: Execute the approval
//     setApproveStatus("Sending approval transaction...");
//     console.log("Sending transaction...");
//     const tx = await nft.approve(inputValue1, tokenId);
//     console.log("✅ Transaction sent:", tx.hash);
//     setApprovalHash(tx.hash);
//     setApproveStatus("Waiting for transaction confirmation...");
//     // Wait for transaction confirmation
//     const receipt = await tx.wait();
//     console.log("✅ Transaction confirmed:", receipt);
//     if (receipt.status === 1) {
//       setApproveStatus("✅ NFT approved successfully!");
//       console.log("✅ NFT approved successfully!");
//     } else {
//       throw new Error("Transaction failed on chain");
//     }
//   } catch (err: any) {
//     console.error("❌ Error in handleApprove:", err);
//     // Enhanced error decoding
//     if (err.data) {
//       console.log("Error data:", err.data);
//       // Common ERC721 errors
//       const errorMap: { [key: string]: string } = {
//         '0xa9fbf51f': 'Not owner or not approved',
//         '0x48f5c3ed': 'Caller is not owner nor approved',
//         '0xce704c88': 'ERC721: approve caller is not owner nor approved for all',
//         '0xdfc0338d': 'ERC721: invalid token ID',
//         '0x5c4c2c41': 'Token does not exist',
//       };
//       const selector = err.data.slice(0, 10);
//       const errorMessage = errorMap[selector] || `Contract error: ${selector}`;
//       setError(`Smart contract error: ${errorMessage}`);
//     } 
//     else if (err.code === "ACTION_REJECTED") {
//       setError("Transaction was rejected by user");
//     } 
//     else if (err.code === "INSUFFICIENT_FUNDS") {
//       setError("Insufficient funds for transaction");
//     }
//     else if (err.message?.includes("not the owner")) {
//       setError(err.message);
//     }
//     else if (err.message?.includes("nonexistent token")) {
//       setError(`Token ID ${tokenId} does not exist`);
//     }
//     else {
//       setError(err.message || "Failed to approve NFT");
//     }
//     setApproveStatus("");
//   } finally {
//     setIsApproving(false);
//   }
// };
//   return (
//     <div className="flex h-screen">
//       {/* Main Content - Left Side */}
//       <div className={`${isWebpageOpen ? 'w-1/2' : 'w-full'} container mx-auto p-6 overflow-auto`}>
//         <button
//           onClick={navigateToDashboard}
//           className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
//         >
//           ← Back to Dashboard
//         </button>
//         <div className="bg-white rounded-xl p-6 shadow-lg">
//           <h1 className="text-2xl font-bold text-gray-800 mb-6">Token Information</h1>
//           {/* Wallet Connection Status */}
//           <div className="mb-4 p-3 bg-blue-100 rounded-lg">
//             <h3 className="font-semibold text-blue-700">
//               {isConnecting ? "🔄 Connecting Wallet..." : 
//                signer ? "✓ Wallet Connected" : "⚠ Connect Wallet to Approve"}
//             </h3>
//             {signer && (
//               <p className="text-blue-600 text-sm">
//                 Connected address: {signer.address}
//               </p>
//             )}
//             {!signer && !isConnecting && (
//               <button
//                 onClick={connectWallet}
//                 disabled={isConnecting}
//                 className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
//               >
//                 {isConnecting ? "Connecting..." : "Connect Wallet"}
//               </button>
//             )}
//           </div>
// {/* Debug Panel */}
// <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
//   <h3 className="font-semibold text-gray-800 mb-3">Contract Debug Info</h3>
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//     <div>
//       <p><strong>NFT Contract:</strong> {nft?.address || 'Not connected'}</p>
//       <p><strong>Token ID:</strong> {tokenId || 'Loading...'}</p>
//       <p><strong>Your Address:</strong> {signer?.address || 'Not connected'}</p>
//     </div>
//     <div>
//       <p><strong>Marketplace Address:</strong> {inputValue1 || 'Not set'}</p>
//       <p><strong>IPFS Hash:</strong> {ipfsHashParam || 'Not available'}</p>
//       <p><strong>Network:</strong> Sepolia Testnet</p>
//     </div>
//   </div>
//   {/* Test Buttons */}
//   <div className="mt-3 flex gap-2">
//     <button
//       onClick={async () => {
//         if (nft && tokenId) {
//           try {
//             const owner = await nft.ownerOf(tokenId);
//             alert(`Token Owner: ${owner}\nYour Address: ${signer?.address}\nMatch: ${owner.toLowerCase() === signer?.address?.toLowerCase()}`);
//           } catch (e: any) {
//             alert(`Error: ${e.message}`);
//           }
//         }
//       }}
//       className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
//     >
//       Test Ownership
//     </button>
//     <button
//       onClick={async () => {
//         if (nft && tokenId) {
//           try {
//             const approved = await nft.getApproved(tokenId);
//             alert(`Currently Approved: ${approved}`);
//           } catch (e: any) {
//             alert(`Error: ${e.message}`);
//           }
//         }
//       }}
//       className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
//     >
//       Check Approval
//     </button>
//   </div>
// </div>
//           {/* Display NFT contract status */}
//           {nft ? (
//             <div className="mb-4 p-3 bg-green-100 rounded-lg">
//               <h3 className="font-semibold text-green-700">✓ NFT Contract Connected</h3>
//               <p className="text-green-600 text-sm">Contract address: {nft.address}</p>
//             </div>
//           ) : (
//             <div className="mb-4 p-3 bg-red-100 rounded-lg">
//               <h3 className="font-semibold text-red-700">✗ NFT Contract Not Available</h3>
//               <p className="text-red-600 text-sm">Please connect your wallet first</p>
//             </div>
//           )}
//           <div className="space-y-4">
//             <div>
//               <h3 className="font-semibold text-gray-700">Token Name:</h3>
//               <p className="text-gray-900">{tokenName || 'Not available'}</p>
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-700">IPFS Hash:</h3>
//               <p className="text-gray-900 break-all">{ipfsHashParam || 'Not available'}</p>
//               <h3 className="font-semibold text-gray-700">Token ID:</h3>
//               <p className="text-gray-900 break-all">{tokenId || 'Not available'}</p>
//               <div className="flex gap-2 mt-2">
//                 <button
//                   onClick={openIPFSViewer}
//                   className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
//                 >
//                   Open IPFS on Right Side
//                 </button>
//                 <a
//                   href={`https://ipfs.io/ipfs/${ipfsHashParam || ''}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
//                 >
//                   Open in New Tab
//                 </a>
//               </div>
//             </div>
//             {/* Transaction Hash Section */}
//             {transactionHash && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Transaction Hash:</h3>
//                 <p className="text-gray-900 break-all text-sm font-mono mb-2">{transactionHash}</p>
//                 <button
//                   onClick={openEtherscan}
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
//                 >
//                   View on Etherscan
//                 </button>
//               </div>
//             )}
//             {/* Quick Links Section */}
//             <div className="mt-4">
//               <h3 className="font-semibold text-gray-700 mb-2">Quick Links:</h3>
//               <div className="flex gap-2 flex-wrap">
//                 <button
//                   onClick={openEtherscan}
//                   className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
//                 >
//                   {transactionHash ? 'Etherscan (Tx)' : 'Etherscan'}
//                 </button>
//                 <button
//                   onClick={() => openCustomWebpage("https://opensea.io")}
//                   className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
//                 >
//                   OpenSea
//                 </button>
//                 <button
//                   onClick={() => openCustomWebpage("https://ipfs.io")}
//                   className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
//                 >
//                   IPFS Gateway
//                 </button>
//               </div>
//             </div>
//             {/* Additional Information Sections */}
//             {area && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Area:</h3>
//                 <p className="text-gray-900">{area}</p>
//               </div>
//             )}
//             {minted !== undefined && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Minted:</h3>
//                 <p className="text-gray-900">{minted ? 'Yes' : 'No'}</p>
//               </div>
//             )}
//             {username && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Username:</h3>
//                 <p className="text-gray-900">{username}</p>
//               </div>
//             )}
//             {/* Approve Section with Input Boxes */}
//             {nft && (
//               <div className="mt-4">
//                 <div className="flex items-center gap-4 mb-4">
//                   <button
//                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400"
//                     onClick={handleApprove}
//                     disabled={(!nft || !tokenId || isApproving) && !signer}
//                   >
//                     {isApproving ? "Approving..." : "Approve"}
//                   </button>
//                   {/* Input Boxes for Address and TokenId */}
//                   <div className="flex gap-2">
//                     <div className="flex-1">
//                       <input
//                         type="text"
//                         value={inputValue1}
//                         onChange={(e) => setInputValue1(e.target.value)}
//                         placeholder="Marketplace Address"
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                       <div className="text-xs text-gray-500 mt-1">Marketplace Contract Address</div>
//                     </div>
//                     <div>
//                       <input
//                         type="text"
//                         value={inputValue2}
//                         onChange={(e) => setInputValue2(e.target.value)}
//                         placeholder="Token ID"
//                         className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         disabled
//                       />
//                       <div className="text-xs text-gray-500 mt-1">Token ID (Auto-filled)</div>
//                     </div>
//                   </div>
//                 </div>
//                 {/* Status Messages */}
//                 {approveStatus && (
//                   <div className={`mt-2 text-sm ${
//                     approveStatus.includes("successfully") ? "text-green-600" : 
//                     approveStatus.includes("error") || approveStatus.includes("failed") ? "text-red-600" : 
//                     "text-blue-600"
//                   }`}>
//                     {approveStatus}
//                   </div>
//                 )}
//                 {/* Error Display */}
//                 {error && (
//                   <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
//                     <p className="text-red-700">
//                       {error}
//                     </p>
//                   </div>
//                 )}
//                 {/* Transaction Hash Display */}
//                 {approvalHash && (
//                   <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                     <h4 className="font-semibold text-blue-800 mb-2">Transaction Details</h4>
//                     <p className="text-blue-600 text-sm break-all font-mono">
//                       {approvalHash}
//                     </p>
//                     <button
//                       onClick={() => window.open(`https://sepolia.etherscan.io/tx/${approvalHash}`, '_blank')}
//                       className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
//                     >
//                       View on Etherscan
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       {/* Webpage Viewer - Right Side */}
//       {isWebpageOpen && (
//         <div className="w-1/2 border-l border-gray-300 flex flex-col">
//           <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
//             <span className="font-semibold text-sm truncate">{webpageUrl}</span>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => window.open(webpageUrl, '_blank')}
//                 className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
//               >
//                 Open in New Tab
//               </button>
//               <button
//                 onClick={closeWebpage}
//                 className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//           <div className="flex-1">
//             <iframe
//               src={webpageUrl}
//               className="w-full h-full border-0"
//               title="External Webpage"
//               sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { useLocation, useRoute } from "wouter";
// import { address } from "../contractsData/Marketplace-address.json";
// import { Contract } from 'ethers';
// import { ethers, BrowserProvider } from 'ethers';
// interface TokenInfoViewerProps {
//   nft: Contract | null;
// }
// const getSigner = async (): Promise<ethers.Signer | null> => {
//   if (typeof window.ethereum !== 'undefined') {
//     try {
//       // Request account access
//       await window.ethereum.request({ method: 'eth_requestAccounts' });
//       const provider = new BrowserProvider(window.ethereum);
//       return await provider.getSigner();
//     } catch (error) {
//       console.error('User denied account access:', error);
//       return null;
//     }
//   } else {
//     console.error('MetaMask not installed');
//     return null;
//   }
// };
// export const TokenInfoViewer: React.FC<TokenInfoViewerProps> = ({ nft }) => {
//    const [signer, setSigner] = useState<ethers.Signer | null>(null);
//   const [approveStatus, setApproveStatus] = useState<string>("");
//   const [isWebpageOpen, setIsWebpageOpen] = useState<boolean>(false);
//   const [webpageUrl, setWebpageUrl] = useState<string>("");
//   const [inputValue1, setInputValue1] = useState<string>(address || "");
//   const [inputValue2, setInputValue2] = useState<string>("");
//   const [isApproving, setIsApproving] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [approvalHash, setApprovalHash] = useState<string>("");
//     useEffect(() => {
//     const connectWallet = async () => {
//       const walletSigner = await getSigner();
//       console.log("Signer Address is ", walletSigner?.address);
//       setSigner(walletSigner);
//     };
//     connectWallet();
//   }, []);
//   // Wouter hooks
//   const [location, setLocation] = useLocation();
//   const [match, params] = useRoute("/token-info/:ipfsHash");
//   // For now, using empty defaults since wouter doesn't have location.state
//   const {
//     tokenName,
//     ipfsHash,
//     transactionHash,
//     area,
//     minted,
//     username,
//   } = {};
//   const ipfsHashParam = params?.ipfsHash || ipfsHash;
//   console.log("NFT Contract:", nft);
//   console.log("Token Name:", tokenName);
//   console.log("IPFS Hash:", ipfsHash);
//   console.log("IPFS Hash Param:", ipfsHashParam);
//   const [tokenId, setTokenId] = useState<number | null>(null);
//   useEffect(() => {
//     console.log("TokenInfoViewer mounted");
//     const fetchTokenID = async () => {
//       try {
//         const resp = await axios.post('/api/get-id', { tokenURI: ipfsHashParam });
//         const data = resp?.data;
//         setTokenId(data?.tokenID?.tokenId ?? null);
//         setInputValue2(data?.tokenID?.tokenId?.toString() ?? "");
//         if (data?.success === true) {
//           console.log("Token ID fetched successfully:", data.tokenID);
//         } else {
//           console.error("Failed to fetch Token ID:", data?.message ?? 'Unknown error');
//         }
//       } catch (err) { 
//         console.error("Error fetching Token ID:", err);
//       }
//     };
//     if (ipfsHashParam) {
//       fetchTokenID();
//     }
//   }, [ipfsHashParam]);
//   // Open IPFS page on the right side
//   const openIPFSViewer = () => {
//     if (ipfsHashParam) {
//       setWebpageUrl(`https://ipfs.io/ipfs/${ipfsHashParam}`);
//       setIsWebpageOpen(true);
//     }
//   };
//   // Open custom webpage
//   const openCustomWebpage = (url: string) => {
//     setWebpageUrl(url);
//     setIsWebpageOpen(true);
//   };
//   const closeWebpage = () => {
//     setIsWebpageOpen(false);
//     setWebpageUrl("");
//   };
//   // Open Etherscan with transaction hash
//   const openEtherscan = () => {
//     if (transactionHash) {
//       openCustomWebpage(`https://sepolia.etherscan.io/tx/${transactionHash}`);
//     } else {
//       openCustomWebpage('https://sepolia.etherscan.io');
//     }
//   };
//   // Navigate back using wouter
//   const navigateToDashboard = () => {
//     setLocation('/dashboard');
//   };
//   // Handle approve function - similar to commented version
//   const handleApprove = async () => {
//     if (!nft || !tokenId) {
//       setError("NFT contract or Token ID not available");
//       return;
//     }
//     if (isApproving) {
//       setError("Approval already in progress");
//       return;
//     }
//     setIsApproving(true);
//     setError("");
//     setApproveStatus("Approving...");
//     setApprovalHash("");
//     try {
//       console.log("NFT Contract:", nft);
//       console.log("Token ID:", tokenId);
//       console.log("Marketplace Address:", inputValue1);
//       // Input validation
//       if (!inputValue1 || !ethers.isAddress(inputValue1)) {
//         throw new Error("Invalid marketplace address");
//       }
//       // Execute the approve transaction
//       const tx = await nft.approve(inputValue1, tokenId);
//       setApprovalHash(tx.hash);
//       setApproveStatus("Waiting for transaction confirmation...");
//       // Wait for transaction confirmation
//       const receipt = await tx.wait();
//       if (receipt.status === 1) {
//         setApproveStatus("NFT approved successfully!");
//         console.log("✅ NFT approved successfully. Transaction:", tx.hash);
//       } else {
//         throw new Error("Transaction failed");
//       }
//     } catch (err: any) {
//       console.error("Error approving NFT:", err);
//       if (err.code === "ACTION_REJECTED") {
//         setError("Transaction was rejected by user");
//       } else if (err.code === "INSUFFICIENT_FUNDS") {
//         setError("Insufficient funds for transaction");
//       } else {
//         setError(err.message || "Failed to approve NFT");
//       }
//       setApproveStatus("");
//     } finally {
//       setIsApproving(false);
//     }
//   };
//   return (
//     <div className="flex h-screen">
//       {/* Main Content - Left Side */}
//       <div className={`${isWebpageOpen ? 'w-1/2' : 'w-full'} container mx-auto p-6 overflow-auto`}>
//         <button
//           onClick={navigateToDashboard}
//           className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
//         >
//           ← Back to Dashboard
//         </button>
//         <div className="bg-white rounded-xl p-6 shadow-lg">
//           <h1 className="text-2xl font-bold text-gray-800 mb-6">Token Information</h1>
//           {/* Display NFT contract status */}
//           {nft ? (
//             <div className="mb-4 p-3 bg-green-100 rounded-lg">
//               <h3 className="font-semibold text-green-700">✓ NFT Contract Connected</h3>
//               <p className="text-green-600 text-sm">Contract address: {nft.address}</p>
//             </div>
//           ) : (
//             <div className="mb-4 p-3 bg-red-100 rounded-lg">
//               <h3 className="font-semibold text-red-700">✗ NFT Contract Not Available</h3>
//               <p className="text-red-600 text-sm">Please connect your wallet first</p>
//             </div>
//           )}
//           <div className="space-y-4">
//             <div>
//               <h3 className="font-semibold text-gray-700">Token Name:</h3>
//               <p className="text-gray-900">{tokenName || 'Not available'}</p>
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-700">IPFS Hash:</h3>
//               <p className="text-gray-900 break-all">{ipfsHashParam || 'Not available'}</p>
//               <h3 className="font-semibold text-gray-700">Token ID:</h3>
//               <p className="text-gray-900 break-all">{tokenId || 'Not available'}</p>
//               <div className="flex gap-2 mt-2">
//                 <button
//                   onClick={openIPFSViewer}
//                   className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
//                 >
//                   Open IPFS on Right Side
//                 </button>
//                 <a
//                   href={`https://ipfs.io/ipfs/${ipfsHashParam || ''}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
//                 >
//                   Open in New Tab
//                 </a>
//               </div>
//             </div>
//             {/* Transaction Hash Section */}
//             {transactionHash && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Transaction Hash:</h3>
//                 <p className="text-gray-900 break-all text-sm font-mono mb-2">{transactionHash}</p>
//                 <button
//                   onClick={openEtherscan}
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
//                 >
//                   View on Etherscan
//                 </button>
//               </div>
//             )}
//             {/* Quick Links Section */}
//             <div className="mt-4">
//               <h3 className="font-semibold text-gray-700 mb-2">Quick Links:</h3>
//               <div className="flex gap-2 flex-wrap">
//                 <button
//                   onClick={openEtherscan}
//                   className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
//                 >
//                   {transactionHash ? 'Etherscan (Tx)' : 'Etherscan'}
//                 </button>
//                 <button
//                   onClick={() => openCustomWebpage("https://opensea.io")}
//                   className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
//                 >
//                   OpenSea
//                 </button>
//                 <button
//                   onClick={() => openCustomWebpage("https://ipfs.io")}
//                   className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
//                 >
//                   IPFS Gateway
//                 </button>
//               </div>
//             </div>
//             {/* Additional Information Sections */}
//             {area && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Area:</h3>
//                 <p className="text-gray-900">{area}</p>
//               </div>
//             )}
//             {minted !== undefined && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Minted:</h3>
//                 <p className="text-gray-900">{minted ? 'Yes' : 'No'}</p>
//               </div>
//             )}
//             {username && (
//               <div>
//                 <h3 className="font-semibold text-gray-700">Username:</h3>
//                 <p className="text-gray-900">{username}</p>
//               </div>
//             )}
//             {/* Approve Section with Input Boxes - Using the commented version structure */}
//             {nft && (
//               <div className="mt-4">
//                 <div className="flex items-center gap-4 mb-4">
//                   <button
//                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400"
//                     onClick={handleApprove}
//                     disabled={!nft || !tokenId || isApproving}
//                   >
//                     {isApproving ? "Approving..." : "Approve"}
//                   </button>
//                   {/* Input Boxes for Address and TokenId */}
//                   <div className="flex gap-2">
//                     <div className="flex-1">
//                       <input
//                         type="text"
//                         value={inputValue1}
//                         onChange={(e) => setInputValue1(e.target.value)}
//                         placeholder="Marketplace Address"
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                       <div className="text-xs text-gray-500 mt-1">Marketplace Contract Address</div>
//                     </div>
//                     <div>
//                       <input
//                         type="text"
//                         value={inputValue2}
//                         onChange={(e) => setInputValue2(e.target.value)}
//                         placeholder="Token ID"
//                         className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         disabled
//                       />
//                       <div className="text-xs text-gray-500 mt-1">Token ID (Auto-filled)</div>
//                     </div>
//                   </div>
//                 </div>
//                 {/* Status Messages */}
//                 {approveStatus && (
//                   <div className={`mt-2 text-sm ${
//                     approveStatus.includes("successfully") ? "text-green-600" : 
//                     approveStatus.includes("error") || approveStatus.includes("failed") ? "text-red-600" : 
//                     "text-blue-600"
//                   }`}>
//                     {approveStatus}
//                   </div>
//                 )}
//                 {/* Error Display */}
//                 {error && (
//                   <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
//                     <p className="text-red-700">
//                       {error}
//                     </p>
//                   </div>
//                 )}
//                 {/* Transaction Hash Display */}
//                 {approvalHash && (
//                   <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                     <h4 className="font-semibold text-blue-800 mb-2">Transaction Details</h4>
//                     <p className="text-blue-600 text-sm break-all font-mono">
//                       {approvalHash}
//                     </p>
//                     <button
//                       onClick={() => window.open(`https://sepolia.etherscan.io/tx/${approvalHash}`, '_blank')}
//                       className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
//                     >
//                       View on Etherscan
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       {/* Webpage Viewer - Right Side */}
//       {isWebpageOpen && (
//         <div className="w-1/2 border-l border-gray-300 flex flex-col">
//           <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
//             <span className="font-semibold text-sm truncate">{webpageUrl}</span>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => window.open(webpageUrl, '_blank')}
//                 className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
//               >
//                 Open in New Tab
//               </button>
//               <button
//                 onClick={closeWebpage}
//                 className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//           <div className="flex-1">
//             <iframe
//               src={webpageUrl}
//               className="w-full h-full border-0"
//               title="External Webpage"
//               sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
