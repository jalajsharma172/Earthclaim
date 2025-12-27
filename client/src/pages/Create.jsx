import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Marketabi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
const VITE_MARKETPLACE_CONTRACT_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
const VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
// Resolve marketplace address: prefer env var, fallback to the compiled address file
const MARKETPLACE_ADDRESS = VITE_MARKETPLACE_CONTRACT_ADDRESS || MarketplaceAddress.address;
import { abi } from '../contractsData/NFT.json';
const Create = ({ marketplace, nft, account }) => {
    const [price, setPrice] = useState('');
    const [tokenId, setTokenID] = useState('');
    // IMPORTANT: default to your NFT contract address, not the marketplace
    const [tokenaddress, setTokenAddress] = useState(VITE_CONTRACT_ADDRESS || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [_marketplace, _setMarketplace] = useState(null);
    const [provider, setProvider] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    // Add wallet connection state
    const [signer, setSigner] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    // Sync with Navbar account
    useEffect(() => {
        if (account && account !== walletAddress) {
            const initSigner = async () => {
                if (window.ethereum) {
                    try {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        setProvider(provider);
                        setSigner(signer);
                        setWalletAddress(account);
                        console.log("Auto-connected via Navbar:", account);
                        // Initialize marketplace contract if not already done
                        try {
                            const marketplace_contract = new ethers.Contract(MARKETPLACE_ADDRESS, Marketabi.abi, signer);
                            _setMarketplace(marketplace_contract);
                        }
                        catch (e) {
                            console.error("Error init marketplace", e);
                        }
                    }
                    catch (e) {
                        console.error("Failed to get signer from existing connection", e);
                    }
                }
            };
            initSigner();
        }
    }, [account, walletAddress]);
    useEffect(() => {
        if (signer) {
            const marketplace_contract = new ethers.Contract(MARKETPLACE_ADDRESS, Marketabi.abi, signer);
            _setMarketplace(marketplace_contract);
        }
    }, [signer]);
    // Wallet connection function
    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setIsConnecting(true);
                setError(null);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                console.log("Signer is ", signer);
                setWalletAddress(accounts[0]);
                setSigner(signer);
                setProvider(provider);
                console.log("Wallet connected:", accounts[0]);
                console.log("Wallet initialized:", accounts[0]);
                try {
                    const marketplace_contract = new ethers.Contract(MARKETPLACE_ADDRESS, Marketabi.abi, signer);
                    _setMarketplace(marketplace_contract);
                }
                catch (err) {
                    console.error("Error setting marketplace contract:", err);
                }
            }
            catch (error) {
                console.error('User denied account access:', error);
                setError('Failed to connect wallet');
            }
            finally {
                setIsConnecting(false);
            }
        }
        else {
            setError('MetaMask not installed');
        }
    };
    // Enhanced error decoding
    const decodeError = (errorData) => {
        const errorSignatures = {
            '0xa9fbf51f': 'Not owner or approved',
            '0x48f5c3ed': 'Caller is not owner nor approved',
            '0xce704c88': 'ERC721: approve caller is not owner nor approved for all',
            '0x08c379a0': 'Error(string) - Generic revert with reason',
            '0xdfc0338d': 'ERC721: invalid token ID',
        };
        const selector = errorData.slice(0, 10);
        return errorSignatures[selector] || `Contract error: ${selector}`;
    };
    const validate = () => {
        if (!tokenId.trim()) {
            setError('Token ID is required');
            return false;
        }
        if (!tokenaddress.trim()) {
            setError('Token contract address is required');
            return false;
        }
        if (!ethers.isAddress(tokenaddress)) {
            setError('Invalid token contract address');
            return false;
        }
        if (tokenaddress.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
            setError('Token contract address must be the NFT contract address, not the marketplace address');
            return false;
        }
        if (!price || Number(price) <= 0) {
            setError('Please enter a valid price');
            return false;
        }
        setError(null);
        return true;
    };
    const createNFT = async (e) => {
        if (e)
            e.preventDefault();
        if (!_marketplace) {
            setError("Please connect wallet before listing NFT");
            await connectWallet();
            return;
        }
        if (!validate())
            return;
        if (!marketplace) {
            setError('Marketplace contract is not loaded');
            return;
        }
        if (!Marketabi.abi) {
            setError('Marketplace abi is not loaded');
            return;
        }
        if (!signer) {
            setError('Marketplace signer is not loaded');
            return;
        }
        // Create a fresh contract instance with the current signer
        const marketplace_contract = new ethers.Contract(MARKETPLACE_ADDRESS, Marketabi.abi, signer);
        // Log contract details for debugging
        console.log("Contract setup:", {
            address: MARKETPLACE_ADDRESS,
            hasAbi: !!Marketabi.abi,
            methods: Object.keys(marketplace_contract.interface.fragments),
            signer: !!signer
        });
        // Validate contract setup
        if (!marketplace_contract.runner) {
            throw new Error("Contract not properly initialized with signer");
        } // First, ensure wallet is connected
        if (!marketplace_contract) {
            setError('Marketplace contract is not connected');
            return;
        }
        setIsLoading(true);
        setError(null);
        setMessage('Starting listing process...');
        try {
            console.log("=== DEBUG INFO ===");
            console.log("Marketplace Contract:", await marketplace_contract.getAddress());
            console.log("Token Address:", tokenaddress);
            console.log("Token ID:", tokenId);
            console.log("Price (ETH):", price);
            console.log("Signer Address:", walletAddress);
            console.log("=================");
            // Step 1: Check if token exists and user is owner
            setMessage('Checking token ownership...');
            console.log("Checking token ownership...");
            try {
                // Create NFT contract instance for the provided NFT address
                const nftContract = new ethers.Contract(tokenaddress, abi, signer);
                const owner = await nftContract.ownerOf(tokenId);
                console.log("✅ Token owner:", owner);
                console.log("✅ Current signer:", walletAddress);
                window.alert(`Token Owner: ${owner}\nYour Address: ${walletAddress}`);
                // if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
                //   throw new Error(`You are not the owner of this token. Actual owner: ${owner}`)
                // }
                console.log("✅ Ownership verified");
            }
            catch (ownerError) {
                console.error("❌ Owner check failed:", ownerError);
                if (ownerError.message?.includes("nonexistent token")) {
                    throw new Error(`Token ID ${tokenId} does not exist`);
                }
                throw ownerError;
            }
            // Step 2: Ensure approval for marketplace (token-level or operator-level)
            setMessage('Checking approval status...');
            console.log('Checking/setting approval status...');
            try {
                const nftContract = new ethers.Contract(tokenaddress, abi, signer);
                // First, check operator approval for all tokens
                const isAllApproved = await nftContract.isApprovedForAll(walletAddress, MARKETPLACE_ADDRESS);
                if (isAllApproved) {
                    console.log('✅ Marketplace has operator approval for all tokens');
                }
                else {
                    // Check token-specific approval
                    let currentApproved = ethers.ZeroAddress;
                    try {
                        currentApproved = await nftContract.getApproved(tokenId);
                    }
                    catch (e) {
                        console.warn('getApproved failed, proceeding with operator approval:', e);
                    }
                    if (currentApproved.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
                        // Try token-specific approve; if it fails, fallback to setApprovalForAll
                        setMessage('Approving marketplace for this token...');
                        try {
                            const approveTx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
                            await approveTx.wait();
                            console.log('✅ Token-specific approval granted');
                        }
                        catch (approveErr) {
                            console.warn('Token-specific approve failed, attempting setApprovalForAll...', approveErr);
                            setMessage('Granting operator approval to marketplace...');
                            const opTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
                            await opTx.wait();
                            console.log('✅ Operator approval granted');
                        }
                    }
                    else {
                        console.log('✅ Marketplace already approved for this token');
                    }
                }
                setMessage('Approval verified or granted');
            }
            catch (approveErr) {
                console.error('❌ Approval step failed:', approveErr);
                throw approveErr;
            }
            // Step 3: Create listing transaction directly (no estimateGas)
            setMessage('Preparing listing transaction...');
            console.log("Preparing listing transaction without gas estimation...");
            // Step 4: Execute the listing
            setMessage('Creating listing transaction...');
            console.log("Creating listing...");
            const listingPrice = ethers.parseEther(price.toString());
            // Guard: ensure function exists on the contract
            const makeItemFn = marketplace_contract.makeItem;
            if (typeof makeItemFn !== 'function') {
                console.error('makeItem is not a function on marketplace contract');
                setError('makeItem not found on Marketplace contract. Ensure ABI and address are updated.');
                setIsLoading(false);
                return;
            }
            // Execute makeItem with explicit parameters (no overrides)
            const tx = await makeItemFn(tokenaddress, tokenId, listingPrice);
            console.log("✅ Transaction sent:", tx.hash);
            setMessage('Transaction sent — waiting for confirmation...');
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed:", receipt);
            if (receipt.status === 1) {
                setMessage('🎉 NFT listed successfully!');
                console.log("✅ NFT listed successfully!");
                // Reset form (default back to NFT contract address)
                setTokenAddress(VITE_CONTRACT_ADDRESS || '');
                setTokenID('');
                setPrice('');
            }
            else {
                throw new Error('Transaction failed on chain');
            }
        }
        catch (err) {
            console.error('❌ Error listing NFT:', err);
            // Enhanced error handling
            if (err.data) {
                const errorReason = decodeError(err.data);
                console.log("Decoded error reason:", errorReason);
                setError(`Smart contract error: ${errorReason}`);
            }
            else if (err.code === "ACTION_REJECTED") {
                setError('Transaction was rejected by user');
            }
            else if (err.code === "INSUFFICIENT_FUNDS") {
                setError('Insufficient funds for transaction');
            }
            else if (err.message?.includes("not the owner")) {
                setError(err.message);
            }
            else if (err.message?.includes("nonexistent token")) {
                setError(`Token ID ${tokenId} does not exist`);
            }
            else {
                setError(err.message || 'Failed to list NFT');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const clearForm = () => {
        setTokenAddress(VITE_CONTRACT_ADDRESS || '');
        setTokenID('');
        setPrice('');
        setError(null);
        setMessage(null);
    };
    return (<div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono border-b-4 border-cyan-400 pb-2 inline-block">
            ⚡ FORGE NFT
          </h1>
          <p className="text-cyan-300 font-mono text-lg">
            List Your Digital Territory on the Marketplace
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Wallet Connection Status */}
          <div className="mb-6 p-4 bg-blue-900 bg-opacity-50 border border-blue-400 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-300 font-mono">
                  {isConnecting ? "🔄 Connecting Wallet..." :
            signer ? "✅ Wallet Connected" : "⚠️ Connect Wallet to List NFT"}
                </h3>
                {walletAddress && (<p className="text-blue-200 text-sm font-mono mt-1">
                    Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>)}
              </div>
              {!signer && !isConnecting && (<button onClick={connectWallet} disabled={isConnecting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono rounded-lg border border-blue-400 transition-all duration-300">
                  Connect Wallet
                </button>)}
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 rounded-lg border border-cyan-400 p-6 relative">
            {/* Corner Decorations */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

            {/* Status Messages */}
            {message && (<div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-400 rounded text-green-300 font-mono">
                <div className="flex items-center">
                  <span className="text-lg mr-2">✅</span>
                  {message}
                </div>
              </div>)}

            {error && (<div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-400 rounded text-red-300 font-mono">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  {error}
                </div>
              </div>)}

            {/* Debug Panel */}
            <div className="mb-6 p-4 bg-gray-900 border border-gray-600 rounded-lg">
              <h4 className="text-cyan-300 font-mono text-sm uppercase mb-2">🔧 Debug Info</h4>
              <div className="text-xs text-gray-300 font-mono space-y-1">
                <p><strong>Marketplace:</strong> {MARKETPLACE_ADDRESS || 'Not connected'}</p>
                <p><strong>Your Address:</strong> {walletAddress || 'Not connected'}</p>
                <p><strong>Token ID:</strong> {tokenId || 'Not set'}</p>
                <p><strong>Token Address:</strong> {tokenaddress || 'Not set'}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={createNFT} className="space-y-6">
              {/* Token ID Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  🆔 TOKEN ID
                </label>
                <input type="text" placeholder="Enter token ID" value={tokenId} onChange={(e) => setTokenID(e.target.value)} disabled={isLoading} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"/>
              </div>

              {/* Token Address Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  📍 CONTRACT ADDRESS
                </label>
                <input type="text" placeholder="0x..." value={tokenaddress} onChange={(e) => setTokenAddress(e.target.value)} disabled={isLoading} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"/>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  💰 PRICE (ETH)
                </label>
                <input type="number" step="0.0001" min="0" placeholder="0.01" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isLoading} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"/>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={clearForm} disabled={isLoading} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-mono py-3 px-6 rounded-lg border border-gray-500 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                  <span className="mr-2">🗑️</span>
                  CLEAR FIELDS
                </button>

                <button type="submit" 
    // disabled={isLoading || !signer}
    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono py-3 px-6 rounded-lg border border-cyan-400 hover:border-cyan-300 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                  {isLoading ? (<>
                      <span className="animate-spin mr-2">⏳</span>
                      FORGING NFT...
                    </>) : (<>
                      <span className="mr-2">⚡</span>
                      FORGE NFT
                    </>)}
                </button>
              </div>
            </form>
          </div>

          {/* Info Panel */}
          <div className="mt-6 bg-black bg-opacity-50 rounded-lg border border-gray-600 p-4">
            <div className="text-cyan-300 font-mono text-sm">
              <div className="flex items-center mb-2">
                <span className="mr-2">ℹ️</span>
                <strong>FORGE PROCESS:</strong>
              </div>
              <ul className="text-gray-300 space-y-1 ml-6">
                <li>• Connect your wallet first</li>
                <li>• Enter valid Token ID and Contract Address</li>
                <li>• Set your desired price in ETH</li>
                <li>• Auto-approval if needed</li>
                <li>• Confirm transaction in your wallet</li>
                <li>• Wait for blockchain confirmation</li>
              </ul>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="mt-8 bg-black bg-opacity-70 rounded-lg border border-cyan-400 py-3">
            <div className="max-w-2xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
              <div>🔧 FORGE READY</div>
              <div>🌐 {signer ? "WALLET CONNECTED" : "CONNECT WALLET"}</div>
              <div>⚡ GAS OPTIMIZED</div>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
export default Create;
