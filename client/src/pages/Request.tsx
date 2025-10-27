import { useState } from 'react';
import { ethers } from 'ethers';

interface RequestProps {
  marketplace: any;
  nft: any;
}

export default function Request({ marketplace, nft }: RequestProps) {
  const [leftForm, setLeftForm] = useState({
    nftContractAddress: '',
    nftTokenId: ''
  });
  
  const [rightForm, setRightForm] = useState({
    nftContractAddress: '',
    nftTokenId: '',
    userAddress: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateForms = () => {
    if (!leftForm.nftContractAddress.trim() || !leftForm.nftTokenId.trim()) {
      setError('Please fill all fields in the Sender section');
      return false;
    }
    
    if (!rightForm.nftContractAddress.trim() || !rightForm.nftTokenId.trim() || !rightForm.userAddress.trim()) {
      setError('Please fill all fields in the Receiver section');
      return false;
    }

    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(leftForm.nftContractAddress)) {
      setError('Invalid NFT contract address in Sender section');
      return false;
    }
    
    if (!ethAddressRegex.test(rightForm.nftContractAddress)) {
      setError('Invalid NFT contract address in Receiver section');
      return false;
    }
    
    if (!ethAddressRegex.test(rightForm.userAddress)) {
      setError('Invalid user address in Receiver section');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForms()) return;

    if (!marketplace) {
      setError('Marketplace contract is not connected');
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      
      // Simulate API call/blockchain transaction
      setMessage('Processing request...');
      
      // Here you would typically call your smart contract function
      // For example:
      const tx = await marketplace.proposeExchange(
        leftForm.nftContractAddress,
        leftForm.nftTokenId,
        rightForm.nftContractAddress,
        rightForm.nftTokenId,
        rightForm.userAddress
      );
      await tx.wait();
       
      setMessage('Request sent successfully! Waiting for receiver approval...');
      
      // Reset forms after successful submission
      setLeftForm({ nftContractAddress: '', nftTokenId: '' });
      setRightForm({ nftContractAddress: '', nftTokenId: '', userAddress: '' });
      
    } catch (err: any) {
      console.error('Error sending request:', err);
      setError(err?.message || 'Failed to send request');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForms = () => {
    setLeftForm({ nftContractAddress: '', nftTokenId: '' });
    setRightForm({ nftContractAddress: '', nftTokenId: '', userAddress: '' });
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono border-b-4 border-cyan-400 pb-2 inline-block">
            🔄 NFT SWAP REQUEST
          </h1>
          <p className="text-cyan-300 font-mono text-lg">
            Initiate NFT Exchange Requests Between Users
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Status Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-400 rounded text-green-300 font-mono">
              <div className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                {message}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-400 rounded text-red-300 font-mono">
              <div className="flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-gray-800 bg-opacity-50 rounded-lg border border-cyan-400 p-6 relative">
            {/* Corner Decorations */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Box - Sender */}
              <div className="bg-gray-900 rounded-lg border border-cyan-400 p-6 relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

                <h2 className="text-2xl font-bold text-white mb-4 font-mono text-center">
                  🎁 SENDER'S NFT
                </h2>
                <p className="text-cyan-300 font-mono text-sm text-center mb-6">
                  Your NFT to exchange
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                      📍 NFT CONTRACT ADDRESS
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={leftForm.nftContractAddress}
                      onChange={(e) => setLeftForm(prev => ({ ...prev, nftContractAddress: e.target.value }))}
                      disabled={isLoading}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                      🆔 NFT TOKEN ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter token ID"
                      value={leftForm.nftTokenId}
                      onChange={(e) => setLeftForm(prev => ({ ...prev, nftTokenId: e.target.value }))}
                      disabled={isLoading}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Right Box - Receiver */}
              <div className="bg-gray-900 rounded-lg border border-purple-400 p-6 relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>

                <h2 className="text-2xl font-bold text-white mb-4 font-mono text-center">
                  🎯 RECEIVER'S DETAILS
                </h2>
                <p className="text-purple-300 font-mono text-sm text-center mb-6">
                  Target NFT and user address
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-300 font-mono text-sm uppercase tracking-wide mb-2">
                      📍 NFT CONTRACT ADDRESS
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={rightForm.nftContractAddress}
                      onChange={(e) => setRightForm(prev => ({ ...prev, nftContractAddress: e.target.value }))}
                      disabled={isLoading}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 font-mono text-sm uppercase tracking-wide mb-2">
                      🆔 NFT TOKEN ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter token ID"
                      value={rightForm.nftTokenId}
                      onChange={(e) => setRightForm(prev => ({ ...prev, nftTokenId: e.target.value }))}
                      disabled={isLoading}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 font-mono text-sm uppercase tracking-wide mb-2">
                      👤 USER ADDRESS
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={rightForm.userAddress}
                      onChange={(e) => setRightForm(prev => ({ ...prev, userAddress: e.target.value }))}
                      disabled={isLoading}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-600">
              <button
                type="button"
                onClick={clearForms}
                disabled={isLoading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-mono py-3 px-6 rounded-lg border border-gray-500 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                <span className="mr-2">🗑️</span>
                CLEAR ALL
              </button>
              
              <button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono py-3 px-6 rounded-lg border border-cyan-400 hover:border-cyan-300 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    SENDING REQUEST...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    SEND SWAP REQUEST
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="mt-6 bg-black bg-opacity-50 rounded-lg border border-gray-600 p-4">
            <div className="text-cyan-300 font-mono text-sm">
              <div className="flex items-center mb-2">
                <span className="mr-2">ℹ️</span>
                <strong>SWAP PROCESS:</strong>
              </div>
              <ul className="text-gray-300 space-y-1 ml-6">
                <li>• Fill in your NFT details (Sender section)</li>
                <li>• Enter the target NFT and user address (Receiver section)</li>
                <li>• Send the swap request for approval</li>
                <li>• Wait for the receiver to accept the exchange</li>
                <li>• Complete the NFT swap transaction</li>
              </ul>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="mt-8 bg-black bg-opacity-70 rounded-lg border border-cyan-400 py-3">
            <div className="max-w-6xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
              <div>🔄 SWAP READY</div>
              <div>🌐 POLYGON NETWORK</div>
              <div>⚡ GAS OPTIMIZED</div>
              <div>🔒 SECURE EXCHANGE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}