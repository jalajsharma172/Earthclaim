import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CLAIM_EARTH_NFT_ABI from "./abi.json";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TokenInfoViewer } from "./TokenInfoViewer.tsx";
import ThreeEarth from "./ThreeEarth";
import StarField from "./StarField";
import { Globe, Shield, Activity, Zap, Server, Database, Wifi } from "lucide-react";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface UserNFTData {
  id: string;
  username: string;
  hashjson: string;
  minted: number;
  createdAt: string;
}

interface DashboardProps {
  account: string | null;
}

import { useActiveAccount } from "thirdweb/react";

export default function Dashboard({ account }: DashboardProps) {
  const navigate = useNavigate();
  const activeAccount = useActiveAccount();
  const [tokenCounter, setTokenCounter] = useState(0);
  const [userAddress, setUserAddress] = useState < string > ("");
  const [connectionStatus, setConnectionStatus] = useState < ConnectionStatus > ("disconnected");
  const [error, setError] = useState < string > ("");
  const [transactionHash, setTransactionHash] = useState < string > ("");
  const [userNFTCount, setUserNFTCount] = useState < number > (0);

  const [userNFTData, setUserNFTData] = useState < UserNFTData[] > ([]);
  const [loadingNFTData, setLoadingNFTData] = useState < boolean > (false);
  const [currentUsername, setCurrentUsername] = useState < string > ("");

  const [nftData, setNftData] = useState < any[] | null > (null);
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState < ethers.BrowserProvider | null > (null);
  const [signer, setSigner] = useState < ethers.Signer | null > (null);

  const [mintingNFTs, setMintingNFTs] = useState < Set < string >> (new Set());
  const [isAnyMinting, setIsAnyMinting] = useState(false);

  // Mint Modal State
  const [showMintModal, setShowMintModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedNft, setSelectedNft] = useState < any | null > (null);
  const [nftImage, setNftImage] = useState < File | null > (null);
  const [uploadedIpfsUrl, setUploadedIpfsUrl] = useState < string > ("");
  const [isUploading, setIsUploading] = useState(false);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");

  useEffect(() => {
    const syncWallet = async () => {
      if (activeAccount) {
        setUserAddress(activeAccount.address);
        setCurrentUsername(activeAccount.address);
        setConnectionStatus("connected");

        // Initialize provider/signer for existing ethers logic
        if (window.ethereum) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            setProvider(provider);
            setSigner(signer);
          } catch (e) {
            console.error("Error initializing provider/signer:", e);
          }
        }

        fetechNFTs(activeAccount.address);
      } else {
        setUserAddress("");
        setCurrentUsername("");
        setConnectionStatus("disconnected");
        setProvider(null);
        setSigner(null);
        setNftData(null);
      }
    };

    syncWallet();
  }, [activeAccount]);

  const mintNFTFromHash = async (nft: any, metadataURI?: string) => {
    if (connectionStatus !== "connected" || !userAddress || !signer) {
      setError("Please connect your wallet first!");
      return;
    }

    if (isAnyMinting) {
      setError("Please wait for the current minting process to complete");
      return;
    }

    if (mintingNFTs.has(nft.IPFShashcode)) {
      setError("Minting already in progress for this NFT");
      return;
    }

    setIsAnyMinting(true);
    setMintingNFTs(prev => new Set(prev).add(nft.IPFShashcode));
    setError("");
    setTransactionHash("");

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, signer);
      // Use the provided metadataURI or fallback to the NFT's hash
      const tokenURI = metadataURI || nft.IPFShashcode;
      const transaction = await contract.mintNFT(tokenURI);

      console.log("Transaction Started: ", transaction.hash);
      setTransactionHash(transaction.hash);

      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        alert(`MISSION SUCCESS: Territory secured! Tx: ${transaction.hash}`);

        const updatedData = nftData?.map(item =>
          item.IPFShashcode === nft.IPFShashcode
            ? { ...item, minted: true, transactionHash: transaction.hash }
            : item
        ) || null;

        setNftData(updatedData);

        try {
          const requestData = {
            username: currentUsername,
            nft: updatedData
          };
          await axios.post("/api/update-polygon-minted", requestData);
        } catch (err) {
          console.error("Error syncing with Command Database:", err);
        }
      } else {
        throw new Error("Transaction Failed");
      }

    } catch (err: any) {
      console.error("Minting Error:", err);
      if (err.code === "ACTION_REJECTED") setError("Mission Aborted by Agent");
      else if (err.code === "INSUFFICIENT_FUNDS") setError("Insufficient Energy Credits (ETH)");
      else setError(err.message || "Minting Protocol Failed");
    } finally {
      setIsAnyMinting(false);
      setMintingNFTs(prev => {
        const newSet = new Set(prev);
        newSet.delete(nft.IPFShashcode);
        return newSet;
      });
    }
  };

  const handleMintClick = (nft: any) => {
    setSelectedNft(nft);
    setShowMintModal(true);
    setModalStep(1);
    setNftImage(null);
    setUploadedIpfsUrl("");
  };

  const handleModalClose = () => {
    setShowMintModal(false);
    setSelectedNft(null);
    setNftImage(null);
    setUploadedIpfsUrl("");
    setModalStep(1);
  };

  const handleNextStep = async () => {
    if (!nftImage) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", nftImage);

      const response = await axios.post("/api/upload-ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setUploadedIpfsUrl(response.data.ipfsUrl);
        // Initialize default metadata
        setNftName(`${selectedNft.Name || "Sector"} #${selectedNft.IPFShashcode?.substring(0, 6)}`);
        setNftDescription(`This sector ${selectedNft.Name} is located at ${JSON.stringify(selectedNft.coordinates)}.`);
        setModalStep(2);
      } else {
        console.error("Upload failed:", response.data.message);
        // Could set an error state here
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedNft) return;

    if (!uploadedIpfsUrl) {
      setError("Please upload an image first");
      return;
    }

    try {
      // 1. Prepare Metadata
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: uploadedIpfsUrl
      };

      console.log("Uploading metadata...", metadata);

      // 2. Upload Metadata to IPFS
      const response = await axios.post("/api/upload-metadata", metadata);

      if (response.data.success) {
        const metadataHash = response.data.ipfsHash;
        console.log("Metadata uploaded: ", metadataHash);

        // 3. Mint with the Metadata Hash
        // We use the new metadata hash as the URI/Hash for the token
        await mintNFTFromHash(selectedNft, metadataHash);

        handleModalClose();
      } else {
        setError("Failed to upload metadata: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Metadata upload failed:", err);
      setError("Failed to create NFT metadata");
    }
  };

  const isMinting = (ipfsHash: string): boolean => {
    return mintingNFTs.has(ipfsHash);
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
    setMintingNFTs(new Set());
    setIsAnyMinting(false);
  };

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  //Free NFTs
  const fetechNFTs = async (walletAddress: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/dashboard_free_nfts', { walletAddress: walletAddress });
      if (response.data.success) {
        setNftData(response.data.data);
        setError('');
      } else {
        setError(response.data.message || 'Data Retrieval Failed');
        setNftData(null);
      }
    } catch (error) {
      setError('Uplink Error: Cannot reach Command Server');
      setNftData(null);
    } finally {
      setLoading(false);
    }
  };

  const isUserLoggedIn = (): boolean => true;

  return (
    <div className="min-h-screen relative overflow-hidden text-cyan-50 font-sans selection:bg-cyan-500/30">

      {/* 1. Background Layer */}
      <StarField />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-900/50 to-black/90 pointer-events-none z-0"></div>

      {/* 2. Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-8">

        {/* HEADER SECTION */}
        <div className="text-center mb-12 relative">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)] mb-2">
            EARTH CLAIM
          </h1>
          <div className="flex items-center justify-center gap-2 text-cyan-300 font-mono text-xs tracking-[0.3em] opacity-80 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            COMMAND CENTER ONLINE
          </div>

          {/* Action Modules */}
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              { icon: "🏆", label: "LEADERBOARD", path: "/leaderboard", color: "from-amber-500/20 to-orange-600/20 border-orange-500/50 hover:border-orange-400" },
              { icon: "🔄", label: "EXCHANGE", path: "/nftexchange", color: "from-blue-500/20 to-cyan-600/20 border-cyan-500/50 hover:border-cyan-400" },
              { icon: "⚡", label: "REWARDS", path: "/earnbywalk", color: "from-purple-500/20 to-pink-600/20 border-pink-500/50 hover:border-pink-400" }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => navigate(btn.path)}
                className={`group relative px-8 py-4 backdrop-blur-md bg-gradient-to-r ${btn.color} border rounded-sm transition-all duration-300 hover:scale-105 active:scale-95`}
              >
                <div className="flex items-center gap-3 font-mono font-bold tracking-widest text-sm">
                  <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{btn.icon}</span>
                  <span className="text-white group-hover:text-cyan-200 transition-colors">{btn.label}</span>
                </div>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>

        {/* HERO SECTION - Holographic Earth */}
        <div className="relative w-full max-w-4xl mx-auto h-[400px] mb-12 rounded-full border border-cyan-500/10 bg-black/40 backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-[800px] h-1 bg-cyan-500/20 absolute top-1/2 animate-scan"></div>
            <div className="text-cyan-500/40 font-mono text-[10px] tracking-widest absolute bottom-8 animate-pulse">Scanning Planetary Sectors...</div>
          </div>

          {/* Reusing Existing ThreeEarth Component */}
          <div className="w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-700">
            <ThreeEarth />
          </div>

          {/* Decorative HUD Elements */}
          <div className="absolute top-4 left-4 border-l-2 border-t-2 border-cyan-500/50 w-8 h-8"></div>
          <div className="absolute top-4 right-4 border-r-2 border-t-2 border-cyan-500/50 w-8 h-8"></div>
          <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-cyan-500/50 w-8 h-8"></div>
          <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-cyan-500/50 w-8 h-8"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {/* LEFT PANEL - Identity & Connection */}
          <div className="xl:col-span-1 space-y-6">

            {/* Wallet Module */}
            <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-6 rounded relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-50">
                <Shield className="w-12 h-12 text-cyan-900" />
              </div>

              <h2 className="text-xl font-mono font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" /> NET-LINK STATUS
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-cyan-950/20 border border-cyan-500/20 rounded">
                  <span className="text-xs font-mono text-cyan-300/70 uppercase">Signal</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-bold font-mono">{connectionStatus.toUpperCase()}</span>
                  </div>
                </div>

                {connectionStatus !== 'connected' ? (
                  <div className="w-full py-4 text-center border border-cyan-500/30 text-cyan-500/50 font-mono text-xs uppercase">
                    Connect via Navbar
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyan-950/40 border-l-2 border-cyan-500">
                      <div className="text-[10px] text-cyan-400/60 font-mono mb-1">DESIGNATED OPERATOR</div>
                      <div className="font-mono text-cyan-100 text-sm tracking-wide">{formatAddress(userAddress)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Modules */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-purple-500/30 p-4 rounded backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                  <Activity size={16} />
                  <span className="text-[10px] font-mono tracking-widest uppercase">Global Mint</span>
                </div>
                <div className="text-3xl font-black font-mono text-white">{tokenCounter}</div>
              </div>

              <div className="bg-black/40 border border-green-500/30 p-4 rounded backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 text-green-400">
                  <Database size={16} />
                  <span className="text-[10px] font-mono tracking-widest uppercase">My Assets</span>
                </div>
                <div className="text-3xl font-black font-mono text-white">{userNFTCount}</div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Available Sectors */}
          <div className="xl:col-span-2">
            <div className="h-full bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-mono font-bold text-cyan-400 flex items-center gap-2">
                  <Server className="w-5 h-5" /> AVAILABLE SECTORS
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-600">
                  <div className="w-2 h-2 bg-cyan-500 animate-ping rounded-full"></div>
                  <span className="animate-pulse">LIVE FEED</span>
                </div>
              </div>

              {connectionStatus !== "connected" ? (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-cyan-900 rounded bg-cyan-950/10">
                  <Wifi className="w-12 h-12 text-cyan-800 mb-4" />
                  <p className="font-mono text-cyan-700">SECURE LINK REQUIRED FOR DATA STREAM</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {loading && (
                    <div className="text-center py-12 text-cyan-500 font-mono animate-pulse">Requesting Satellite Data...</div>
                  )}

                  {!loading && nftData?.map((item: any, idx: number) => {
                    const isProcess = isMinting(item.IPFShashcode);
                    const isMinted = item.minted === true;

                    return (
                      <div key={idx} className={`relative p-4 border ${isMinted ? 'border-green-900/50 bg-green-950/10' : 'border-cyan-500/20 bg-cyan-950/10'} hover:border-cyan-400/50 transition-all roundedgroup`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-cyan-100 font-mono text-lg">{item.Name || `SECTOR-${idx}`}</h3>
                            <div className="flex items-center gap-4 mt-1 text-xs font-mono text-cyan-400/60">
                              <span>AREA: {Number(item.Area || 0).toLocaleString()} m²</span>
                              <span className="hidden md:inline">|</span>
                              <span className="truncate max-w-[200px]">HASH: {item.IPFShashcode || 'PENDING'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate('/view-polygon', {
                                state: {
                                  ipfsHash: item.IPFShashcode,
                                  coordinates: item.coordinates,
                                  name: item.Name
                                }
                              })}
                              className="px-4 py-2 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-300 border border-cyan-700/50 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                            >
                              View Map
                            </button>

                            {!isMinted ? (
                              <button
                                onClick={() => handleMintClick(item)}
                                disabled={isProcess}
                                className={`px-6 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isProcess
                                  ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 cursor-wait'
                                  : 'bg-green-600 hover:bg-green-500 text-white border border-green-500'
                                  }`}
                              >
                                {isProcess ? 'MINTING...' : 'CLAIM SECTOR'}
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/token-info/${item.IPFShashcode}`, { state: { ...item, signer } })}
                                className="px-6 py-2 bg-blue-600/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded text-xs font-mono uppercase tracking-wider"
                              >
                                Asset Data
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Overlay */}
        {transactionHash && (
          <div className="fixed bottom-8 right-8 max-w-sm bg-black/90 border border-green-500 text-green-400 p-4 rounded shadow-[0_0_20px_rgba(34,197,94,0.3)] z-50 font-mono text-xs animate-slide-up">
            <div className="flex items-center gap-2 mb-2 font-bold uppercase">
              <Zap size={14} /> Transmission Complete
            </div>
            <div className="truncate opacity-80">HASH: {transactionHash}</div>
          </div>
        )}

        {showMintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <h3 className="text-xl font-mono font-bold text-cyan-400 mb-4">CLAIM SECTOR</h3>

              <div className="mb-4">
                <p className="text-sm text-cyan-300/70 mb-2 font-mono">SECTOR ID: {selectedNft?.Name || "UNKNOWN"}</p>
                <div className="flex items-center justify-between text-xs text-cyan-500/50 mb-4">
                  <span className="break-all truncate max-w-[200px]">{selectedNft?.IPFShashcode}</span>
                  <span className="font-bold border border-cyan-900 px-2 py-1 rounded bg-black/40">STEP {modalStep}/2</span>
                </div>
              </div>

              {modalStep === 1 ? (
                /* STEP 1: Upload Imgae */
                <div className="mb-6">
                  <label className="block text-sm font-mono text-cyan-100 mb-2">UPLOAD SURVEY IMAGE</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNftImage(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-cyan-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-900/30 file:text-cyan-400 hover:file:bg-cyan-900/50 cursor-pointer border border-cyan-900 rounded p-2 bg-black/50"
                  />

                  {nftImage && (
                    <div className="mt-4 p-2 border border-cyan-500/30 rounded bg-black/40 text-center">
                      <p className="text-[10px] text-cyan-400 mb-2 font-mono uppercase tracking-widest">Preview</p>
                      <img
                        src={URL.createObjectURL(nftImage)}
                        alt="Survey Preview"
                        className="max-h-48 mx-auto rounded border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: Cost & Confirmation */
                <div className="mb-6">
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-xs font-mono text-cyan-300 mb-1">TOKEN NAME</label>
                      <input
                        type="text"
                        value={nftName}
                        onChange={(e) => setNftName(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/30 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                        placeholder="Enter token name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-cyan-300 mb-1">DESCRIPTION</label>
                      <textarea
                        value={nftDescription}
                        onChange={(e) => setNftDescription(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/30 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none font-mono h-24 resize-none"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>

                  <div className="p-4 border border-cyan-500/30 rounded bg-black/40 mb-4 animate-pulse">
                    <p className="text-xs text-cyan-400 mb-1 font-mono">IPFS URI GENERATED</p>
                    <p className="text-[10px] text-gray-500 break-all bg-black/50 p-2 rounded border border-white/5 font-mono">
                      {uploadedIpfsUrl}
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-cyan-950/20 p-4 rounded border border-cyan-800/50">
                    <span className="text-sm font-mono text-cyan-200">ESTIMATED COST</span>
                    <span className="text-lg font-bold font-mono text-white">~0.005 ETH</span>
                  </div>
                </div>
              )
              }

              <div className="flex gap-4 justify-end">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-all"
                  disabled={isUploading}
                >
                  Cancel
                </button>

                {modalStep === 1 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={!nftImage || isUploading}
                    className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] ${!nftImage || isUploading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                      : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
                      }`}
                  >
                    {isUploading ? 'UPLOADING...' : 'NEXT ->'}
                  </button>
                ) : (
                  <button
                    onClick={handleModalSubmit}
                    className="px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white border border-green-500 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  >
                    Create NFT
                  </button>
                )}
              </div>
            </div >
          </div >
        )}

      </div >

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s infinite linear;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}</style>
    </div >
  );
}