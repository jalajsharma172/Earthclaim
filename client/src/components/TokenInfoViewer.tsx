import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const TokenInfoViewer: React.FC = () => {
  const [approveStatus, setApproveStatus] = useState<string>("");
  // Approve function using ethers.js
  async function handleApprove() {
    if (!signer || !ipfsHashParam) {
      setApproveStatus("No signer or token hash");
      return;
    }
    try {
      setApproveStatus("Approving...");
      // Replace with your contract address and ABI
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
      const ABI = [
        // Minimal ERC721 approve ABI
        "function approve(address to, uint256 tokenId) public"
      ];
      const contract = new (await import("ethers")).ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      // For demonstration, approve the dashboard user address for this tokenId
      // You may want to pass a real address and tokenId
      const toAddress = signer.address || await signer.getAddress();
      // Use ipfsHashParam as tokenId if possible, else prompt user
      // If tokenId is not a number, you may need to map it
      const tokenId = typeof ipfsHashParam === 'string' && !isNaN(Number(ipfsHashParam)) ? Number(ipfsHashParam) : 0;
      const tx = await contract.approve(toAddress, tokenId);
      await tx.wait();
      setApproveStatus("Approved!");
    } catch (err: any) {
      setApproveStatus("Error: " + (err?.message || String(err)));
    }
  }
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Get additional data from navigation state, fallback to params if needed
  const {
    tokenName,
    ipfsHash,
    signer,
    transactionHash,
    area,
    minted,
    username,
  } = location.state || {};

  // Fallback for direct URL access (no state)
  const ipfsHashParam = params.ipfsHash || ipfsHash;

  return (
    <div className="container mx-auto p-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Token Information</h1>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Token Name:</h3>
            <p className="text-gray-900">{tokenName ? tokenName : 'no name'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">IPFS Hash:</h3>
            <p className="text-gray-900 break-all">{ipfsHashParam}</p>
            <a
              href={`https://ipfs.io/ipfs/${ipfsHashParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline mt-2 inline-block"
            >
              View on IPFS
            </a>
          </div>
          {signer && (
            <div>
              <button
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                // onClick={handleApprove}
              >
                Approve
              </button>
              {approveStatus && (
                <div className="mt-2 text-sm text-gray-700">{approveStatus}</div>
              )}
            </div>
          )}
          {transactionHash && (
            <div>
              <h3 className="font-semibold text-gray-700">Transaction Hash:</h3>
              <p className="text-gray-900 break-all">{transactionHash}</p>
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
};