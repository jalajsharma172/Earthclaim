import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CLAIM_EARTH_NFT_ABI from "./abi.json"; // Import the ABI from a separate JSON file 

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface NFT {
  area: string;
  hash: string;
  tokenURI: string;
}

  // Replace with your actual contract address
  // Check initial wallet connection and set up listeners
  // Update user-specific data when address changes


const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ;

const mockNFTs: NFT[] = [
  { area: "Area 51", hash: "0xabc123", tokenURI: "ipfs://QmArea51Metadata" },
  { area: "Area 52", hash: "0xdef456", tokenURI: "ipfs://QmArea52Metadata" },
  { area: "Area 53", hash: "0xghi789", tokenURI: "ipfs://QmArea53Metadata" },
  { area: "Area 54", hash: "0xjkl012", tokenURI: "ipfs://QmArea54Metadata" },
  { area: "Area 55", hash: "0xmnq345", tokenURI: "ipfs://QmArea55Metadata" },
];

// Connection status types
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// Interface for UserNFT data
interface UserNFTData {
  id: string;
  username: string;
  hashjson: string;
  minted: number; // 0 = false (not minted), 1 = true (minted)
  createdAt: string;
}

export default function Dashboard() {
  const [userAddress, setUserAddress] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string>("");
  const [claimingNFT, setClaimingNFT] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [tokenCounter, setTokenCounter] = useState<number>(0);
  const [userNFTCount, setUserNFTCount] = useState<number>(0);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  // New state for user's NFT data
  const [userNFTData, setUserNFTData] = useState<UserNFTData[]>([]);
  const [loadingNFTData, setLoadingNFTData] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>("");

    // Check initial wallet connection and set up listeners
  // handleSuccessfulConnection---setUserAddress(address);// Form----// Load blockchain data
  //resetConnection

  useEffect(() => {
    initializeWalletConnection();
    
    // Also fetch NFT data even if wallet is not connected
    const username = getUsernameFromStorage();
    setCurrentUsername(username);
    if (username !== "Anonymous") {
      fetchUserNFTData(username);
    }
    
    // Cleanup listeners on unmount
    return () => {
      removeEventListeners();
    };
  }, []);

  // Update user-specific data when address changes
  useEffect(() => {
    if (userAddress && provider) {
      loadUserData();
    } else {
      setUserNFTCount(0);
    }
  }, [userAddress, provider]);

  const initializeWalletConnection = async () => {
    if (typeof window.ethereum === "undefined") {
      setConnectionStatus("disconnected");
      return;
    }

    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ 
        method: "eth_accounts" 
      });
      
      if (accounts.length > 0) {
        await handleSuccessfulConnection(accounts[0]);
      } else {
        setConnectionStatus("disconnected");
      }

      // Set up event listeners for real-time updates
      setupEventListeners();

    } catch (err) {
      console.error("Error initializing wallet connection:", err);
      setConnectionStatus("error");
      setError("Failed to initialize wallet connection");
    }
  };

  const setupEventListeners = () => { 
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("connect", handleConnect);
      window.ethereum.on("disconnect", handleDisconnect);
    }
  };

  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("connect", handleConnect);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    console.log("Accounts changed:", accounts); 
    
    if (accounts.length === 0) {
      // User disconnected all accounts via MetaMask UI
      handleDisconnect();
    } else {
      // User switched accounts
      await handleSuccessfulConnection(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    console.log("Chain changed:", chainId); 
    window.location.reload();
  };

  const handleConnect = async (connectInfo: any) => {
    console.log("Wallet connected:", connectInfo);
    // When wallet connects, check accounts
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      await handleSuccessfulConnection(accounts[0]);
    }
  };

  const handleDisconnect = (error?: any) => {
    console.log("Wallet disconnected:", error);
    resetConnection();
    setConnectionStatus("disconnected");
    setError(error?.message || "Wallet disconnected");
  };

  const handleSuccessfulConnection = async (address: string) => {
    try {
      setUserAddress(address);// Form
      setConnectionStatus("connected");
      setError("");
      
      // Initialize provider and signer
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      
      setProvider(newProvider);
      setSigner(newSigner);
      
      // Get username from localStorage and fetch NFT data
      const username = getUsernameFromStorage();
      setCurrentUsername(username);
      await fetchUserNFTData(username);
      
      // Load blockchain data
      const tokennumber = await loadTokenCounter(newProvider);// number of users of same username.
      setTokenCounter(tokennumber);
      await loadUserData();

      
    } catch (err) {
      console.error("Error in successful connection:", err);
      setConnectionStatus("error");
      setError("Failed to complete wallet connection");
    }
  };

  const resetConnection = () => {
    setUserAddress("");
    setProvider(null);
    setSigner(null);
    setTokenCounter(0);
    setUserNFTCount(0);
    setTransactionHash("");
    setError("");
    setUserNFTData([]);
    setCurrentUsername("");
    setLoadingNFTData(false);
  };



  const loadTokenCounter = async (providerInstance?: ethers.BrowserProvider) => {
    // const prov = providerInstance ;
    // if (!prov) {
    //   console.log("Db not working ");
    //   return;
    // }

    // try {
    //   const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, prov);
    //   const counter = await contract.tokenCounter();
    //   setTokenCounter(Number(counter));
    // } catch (err) {
    //   console.error("Error loading token counter:", err);
    // }
    return 101;
  };

  const loadUserData = async () => {
    if (!provider || !userAddress) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      setUserNFTCount(Number(balance));
    } catch (err) {
      console.error("Error loading user NFT count:", err);
    }
  };

  // Function to get username from localStorage (same as registration)
  const getUsernameFromStorage = (): string => {
    try {
      const savedUser = localStorage.getItem('territoryWalkerUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.username) {
          console.log("Retrieved username from localStorage:", parsed.username);
          return parsed.username;
        }
      }
    } catch (error) {
      console.error("Error retrieving username from localStorage:", error);
    }
    
    console.log("No username found in localStorage, using 'Anonymous'");
    return "Anonymous";
  };

  // Function to check if user is properly logged in
  const isUserLoggedIn = (): boolean => {
    const username = getUsernameFromStorage();
    return username !== "Anonymous" && username.trim() !== "";
  };

  // Function to fetch user's NFT data from backend
  const fetchUserNFTData = async (username: string) => {
    if (!username || username === "Anonymous") {
      console.log("fetchUserNFTData: No valid username provided:", username);
      return;
    }
    
    setLoadingNFTData(true);
    try {
      console.log("Fetching NFT data for username:", username);
      const userNFTs = await userNFTAPI.getUserNFTsByUsername(username);
      console.log("Fetched user NFTs:", userNFTs);
      setUserNFTData(userNFTs);
      
      // If no NFTs exist, create a test one for demo
      // if (userNFTs.length === 0) {
      //   console.log("No NFTs found, creating test NFT for demo");
      //   await saveNFTHash(username, `demo_hash_${Date.now()}`);
      // }
    } catch (err) {
      console.error("Error fetching user NFT data:", err);
      console.log("API might be down, creating demo NFT");
      // If API fails, create a demo NFT
      try {
        await saveNFTHash(username, `demo_hash_${Date.now()}`);
      } catch (saveErr) {
        console.error("Failed to create demo NFT:", saveErr);
        setError("Failed to load your NFT data - API connection failed");
      }
    } finally {
      setLoadingNFTData(false);
    }
  };

  // Function to save NFT hash to database
  const saveNFTHash = async (username: string, hashcode: string) => {
    try {
      await userNFTAPI.createUserNFT(username, hashcode);
      console.log("Data Saved for Dashboard for user:", username, "Hash:", hashcode);
      // Refresh the NFT data to show the new entry
      await fetchUserNFTData(username);
    } catch (err) {
      console.error("Error saving NFT hash:", err);
      setError("Failed to save NFT hash");
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setConnectionStatus("error");
      setError("MetaMask is not installed!");
      return;
    }

    setConnectionStatus("connecting");
    setError("");

    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (accounts.length > 0) {
        await handleSuccessfulConnection(accounts[0]);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setConnectionStatus("error");
      
      if (err.code === 4001) {
        setError("Connection rejected by user");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      // Method 1: Try to use MetaMask's disconnect method (if available)
      if (window.ethereum && window.ethereum.disconnect) {
        try {
          await window.ethereum.disconnect();
        } catch (disconnectErr) {
          console.log("MetaMask disconnect method not available");
        }
      }

      // Method 2: Try to use the provider's disconnect (for newer versions)
      if (window.ethereum && window.ethereum._providers) {
        try {
          await window.ethereum._providers[0].disconnect();
        } catch (err) {
          console.log("Provider disconnect not available");
        }
      }

      // Method 3: Try to revoke permissions (modern approach)
      if (window.ethereum && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [
              {
                eth_accounts: {}
              }
            ]
          });
        } catch (revokeErr: any) {
          console.log("Permission revocation not supported:", revokeErr.message);
        }
      }

      // Method 4: Clear accounts by requesting empty account access
      try {
        await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [] // Some versions might support this
        });
      } catch (emptyErr) {
        console.log("Empty account request not supported");
      }

      // Method 5: Always reset local state (this always works)
      resetConnection();
      setConnectionStatus("disconnected");
      
      console.log("Wallet disconnected successfully");

    } catch (err: any) {
      console.error("Error in disconnect process:", err);
      // Even if MetaMask methods fail, we still reset our local state
      resetConnection();
      setConnectionStatus("disconnected");
      setError("Disconnected from application (MetaMask connection maintained)");
    }
  };

  // Alternative disconnect method that always works
  const forceDisconnect = () => {
    resetConnection();
    setConnectionStatus("disconnected");
    setError("Disconnected from application. To fully disconnect, please use MetaMask's interface.");
  };

  const mintNFT = async (nft: NFT) => {
    if (connectionStatus !== "connected" || !userAddress || !signer) {
      setError("Please connect your wallet first!");
      return;
    }

    setClaimingNFT(nft.area);
    setError("");
    setTransactionHash("");

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, signer);

      // Execute the mintNFT transaction  
      const transaction = await contract.mintNFT(nft.tokenURI);
      
      setTransactionHash(transaction.hash);
      
      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      
      if (receipt.status === 1) {
        // Transaction successful
        alert(`Successfully minted NFT for ${nft.area}! Transaction: ${transaction.hash}`);
        
        // Update counters
        await loadTokenCounter();
        await loadUserData();
        
      } else {
        throw new Error("Transaction failed");
      }

    } catch (err: any) {
      console.error("Error minting NFT:", err);
      
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction was rejected by user");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        setError("Insufficient funds for transaction");
      } else {
        setError(err.message || "Failed to mint NFT");
      }
    } finally {
      setClaimingNFT(null);
    }
  };

  // Function to mint NFT from user's saved hash
  const mintNFTFromHash = async (nft: UserNFTData) => {
    if (connectionStatus !== "connected" || !userAddress || !signer) {
      setError("Please connect your wallet first!");
      return;
    }

    setClaimingNFT(nft.id);
    setError("");
    setTransactionHash("");

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, signer);

      // Create tokenURI from the saved hash
      const tokenURI = `https://fuchsia-secondary-grasshopper-71.mypinata.cloud/ipfs/${nft.hashjson}`;
      
      // Execute the mintNFT transaction  
      const transaction = await contract.mintNFT(tokenURI);
      
      setTransactionHash(transaction.hash);
      
      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      
      if (receipt.status === 1) {
        // Transaction successful
        alert(`Successfully minted NFT from your saved hash! Transaction: ${transaction.hash}`);
        
        // Update the NFT as minted in database
        try {
          await userNFTAPI.updateUserNFTMintedStatus(nft.id, true);
          console.log("Updated NFT minted status in database");
        } catch (updateErr) {
          console.error("Failed to update minted status:", updateErr);
        }
        
        // Update counters and refresh data
        await loadTokenCounter();
        await loadUserData();
        await fetchUserNFTData(currentUsername);
        
      } else {
        throw new Error("Transaction failed");
      }

    } catch (err: any) {
      console.error("Error minting NFT from hash:", err);
      
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction was rejected by user");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        setError("Insufficient funds for transaction");
      } else {
        setError(err.message || "Failed to mint NFT from hash");
      }
    } finally {
      setClaimingNFT(null);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-yellow-500 animate-pulse";
      case "error": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected": return "Connected";
      case "connecting": return "Connecting...";
      case "error": return "Connection Error";
      default: return "Disconnected";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Claim Earth NFT
          </h1>
          <p className="text-gray-600 text-lg">Mint your digital land NFTs on the blockchain</p>
          
          {/* Welcome Message with Username */}
          {connectionStatus === "connected" && currentUsername && currentUsername !== "Anonymous" && (
            <div className="mt-4 inline-block">
              <div className="px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full border border-indigo-200">
                <p className="text-indigo-800 font-semibold">
                  Welcome back, <span className="font-mono font-bold text-purple-700">{currentUsername}</span>! 👋
                </p>
              </div>
            </div>
          )}
          
          {/* Login Prompt if no username */}
          {connectionStatus === "connected" && (currentUsername === "Anonymous" || !currentUsername) && (
            <div className="mt-4 inline-block">
              <div className="px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-full border border-orange-200">
                <p className="text-orange-800 font-semibold">
                  Please <a href="/" className="underline text-red-700 hover:text-red-900">login or register</a> to see your NFTs
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Menu */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a 
              href="/dashboard"
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-purple-600 font-semibold border-2 border-purple-200 hover:border-purple-400"
            >
              🏠 Dashboard
            </a>
            <a 
              href="/map"
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-blue-600 font-semibold border-2 border-blue-200 hover:border-blue-400"
            >
              🗺️ Map View
            </a>
            <a 
              href="/rewards"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105"
            >
              🎁 Earn Rewards
            </a>
            <a 
              href="/leaderboard"
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-green-600 font-semibold border-2 border-green-200 hover:border-green-400"
            >
              🏆 Leaderboard
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Panel - Stats & Wallet */}
          <div className="xl:col-span-1 space-y-8">
            {/* Wallet Connection Card */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Connection</h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
                    <span className="text-gray-600 font-medium">
                      {getConnectionStatusText()}
                    </span>
                  </div>
                  
                  {/* Connection Instructions */}
                  {connectionStatus === "disconnected" && (
                    <p className="text-sm text-gray-500">
                      Connect your MetaMask wallet to start minting NFTs
                    </p>
                  )}
                  {connectionStatus === "connecting" && (
                    <p className="text-sm text-yellow-600">
                      Please check MetaMask and approve the connection...
                    </p>
                  )}
                  {connectionStatus === "connected" && (
                    <p className="text-sm text-green-600">
                      Wallet connected! You can now mint NFTs.
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4">
                  {connectionStatus !== "connected" ? (
                    <button
                      onClick={connectWallet}
                      disabled={connectionStatus === "connecting"}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {connectionStatus === "connecting" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Connecting...
                        </div>
                      ) : (
                        'Connect Wallet'
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={disconnectWallet}
                        className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        Disconnect Wallet
                      </button>
                      <button
                        onClick={forceDisconnect}
                        className="px-8 py-2 text-xs bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
                      >
                        Force App Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User Address Display */}
              {connectionStatus === "connected" && userAddress && (
                <div className="mt-6 space-y-4">
                  {/* Username Display */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Username:
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-white rounded-lg border border-blue-300 font-mono text-sm text-gray-800 font-bold">
                        {currentUsername || "Generating..."}
                      </div>
                      {currentUsername && (
                        <button
                          onClick={() => navigator.clipboard.writeText(currentUsername)}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Copy username to clipboard"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Wallet Address Display */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Connected Address:
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-white rounded-lg border border-green-300 font-mono text-sm text-gray-800">
                        {formatAddress(userAddress)}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(userAddress)}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Hash Display */}
              {transactionHash && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Transaction:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-lg border border-blue-300 font-mono text-sm text-gray-800 break-all">
                      {formatAddress(transactionHash)}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(transactionHash)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-500">⚠</span>
                    <p className="text-red-600 text-sm font-medium">Error:</p>
                  </div>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Disconnect Info */}
              {connectionStatus === "disconnected" && userAddress && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-700 text-sm">
                    <strong>Note:</strong> To fully disconnect your wallet from all websites, 
                    use MetaMask's interface: Click the MetaMask icon → Click the three dots → 
                    Connected sites → Disconnect from all sites.
                  </p>
                </div>
              )}
            </div>

            {/* User Profile Card */}
            {connectionStatus === "connected" && currentUsername && (
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-3xl shadow-xl p-6 border border-indigo-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-800">User Profile</h3>
                      <p className="text-indigo-600 font-mono font-semibold">{currentUsername}</p>
                      <p className="text-sm text-indigo-500">{formatAddress(userAddress)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-indigo-600">Total NFTs</div>
                    <div className="text-2xl font-bold text-indigo-800">{userNFTData.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-sm opacity-90">Platform Total</div>
                <div className="text-3xl font-bold mt-2">{tokenCounter}</div>
                <div className="text-xs opacity-75 mt-1">NFTs minted globally</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-sm opacity-90">Your Minted NFTs</div>
                <div className="text-3xl font-bold mt-2">{userNFTCount}</div>
                <div className="text-xs opacity-75 mt-1">In your wallet</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-sm opacity-90">Ready to Mint</div>
                <div className="text-3xl font-bold mt-2">{userNFTData.filter(nft => nft.minted === 0).length}</div>
                <div className="text-xs opacity-75 mt-1">
                  {currentUsername && currentUsername !== "Anonymous" ? `Unminted NFTs for ${currentUsername}` : "Login to see yours"}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Panel - Stats Summary */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-xl p-6 border border-gray-200 h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quick Stats</h2>
              <p className="text-gray-600 mb-6">Your NFT overview</p>
              
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="text-lg font-bold text-blue-600">{userNFTData.length}</div>
                  <div className="text-sm text-gray-600">Total Hash Codes</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {userNFTData.filter(nft => nft.minted === 1).length} minted, {userNFTData.filter(nft => nft.minted === 0).length} pending
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="text-lg font-bold text-green-600">{userNFTCount}</div>
                  <div className="text-sm text-gray-600">Minted NFTs</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="text-lg font-bold text-purple-600">{tokenCounter}</div>
                  <div className="text-sm text-gray-600">Total Platform NFTs</div>
                </div>

                {connectionStatus === "connected" && isUserLoggedIn() && (
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="text-sm text-gray-700 mb-2">Username:</div>
                    <div className="font-mono font-bold text-indigo-600">{currentUsername}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Available NFTs to Mint */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-xl p-6 md:p-8 border border-purple-200 h-full">
              <h2 className="text-2xl font-bold text-purple-800 mb-2">Available Land NFTs</h2>
              <p className="text-purple-600 mb-4">Mint your digital territories on blockchain</p>
              
              {connectionStatus !== "connected" ? (
                <div className="text-center py-8">
                  <p className="text-purple-600">Connect wallet to mint NFTs</p>
                </div>
              ) : !isUserLoggedIn() ? (
                <div className="text-center py-8">
                  <p className="text-purple-600 mb-2">Please login first</p>
                  <p className="text-sm text-purple-500">
                    <a href="/" className="underline hover:text-purple-700">Go to login page</a> to register/login
                  </p>
                </div>
              ) : (
                <>
                  {/* Control buttons */}
                  <div className="flex items-center justify-between text-sm text-purple-700 mb-4">
                    <div>Username: <span className="font-mono font-bold">{currentUsername}</span></div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveNFTHash(currentUsername, `test_hash_${Date.now()}`)}
                        disabled={loadingNFTData}
                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                        title="Add test NFT"
                      >
                        ➕ Test
                      </button>
                      <button
                        onClick={() => {
                          console.log("Manual refresh clicked for user:", currentUsername);
                          fetchUserNFTData(currentUsername);
                        }}
                        disabled={loadingNFTData}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                        title="Refresh NFT data"
                      >
                        🔄 Load
                      </button>
                      <button
                        onClick={() => {
                          console.log("Force creating demo NFT for:", currentUsername);
                          saveNFTHash(currentUsername, `demo_${Date.now()}`);
                        }}
                        disabled={loadingNFTData}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                        title="Create demo NFT"
                      >
                        🆕 Demo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {loadingNFTData ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-purple-600 mt-2">Loading your NFTs...</p>
                      </div>
                    ) : userNFTData.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-purple-600 mb-2">No NFTs available</p>
                        <p className="text-sm text-purple-500">Create polygons in MapView to generate NFTs!</p>
                        <div className="mt-4 text-xs text-gray-500">
                          <p>Username: {currentUsername}</p>
                          <p>Data Length: {userNFTData.length}</p>
                          <p>Loading: {loadingNFTData ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    ) : (
                      userNFTData.map((nft, idx) => (
                        <div 
                          key={nft.id} 
                          className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-200 border border-purple-100"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-800">Land NFT #{idx + 1}</div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  nft.minted === 1 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {nft.minted === 1 ? 'Minted' : 'Pending'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-1 break-all">
                                Hash: {nft.hashjson.length > 20 ? `${nft.hashjson.substring(0, 20)}...` : nft.hashjson}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Created: {new Date(nft.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {/* Always show mint button - removed conditional rendering */}
                              <button 
                                onClick={() => mintNFTFromHash(nft)}
                                disabled={connectionStatus !== "connected" || claimingNFT === nft.id}
                                className={`px-4 py-2 rounded-xl font-bold text-white shadow-lg transition-all duration-200 min-w-20 ${
                                  connectionStatus === "connected" && claimingNFT !== nft.id
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105' 
                                    : 'bg-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {claimingNFT === nft.id ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : connectionStatus === "connected" ? (
                                  'Mint'
                                ) : (
                                  'Connect'
                                )}
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(nft.hashjson)}
                                className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                title="Copy hash code"
                              >
                                📋 Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {typeof window.ethereum === "undefined" && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              MetaMask Not Detected
            </h3>
            <p className="text-yellow-700 mb-4">
              Please install MetaMask to connect your wallet and mint NFTs.
            </p>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Download MetaMask
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
