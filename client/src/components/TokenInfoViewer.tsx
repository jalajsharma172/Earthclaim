import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

export const TokenInfoViewer: React.FC = () => {
  const [approveStatus, setApproveStatus] = useState<string>("");
  const [isWebpageOpen, setIsWebpageOpen] = useState<boolean>(false);
  const [webpageUrl, setWebpageUrl] = useState<string>("");

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Get additional data from navigation state
  const {
    tokenName,
    ipfsHash,
    signer,
    transactionHash,
    area,
    minted,
    username,
  } = location.state || {};

  const ipfsHashParam = params.ipfsHash || ipfsHash;
  console.log(tokenName," ");
  console.log(ipfsHash," ");
  console.log(transactionHash," ");
  console.log(signer," ");
  console.log(area," ");
  console.log(minted," ");
  console.log(username," ");
  console.log(ipfsHashParam," ");
  
  
  // Open IPFS page on the right side
  const openIPFSViewer = () => {
    if (ipfsHashParam) {
      setWebpageUrl(`https://ipfs.io/ipfs/${ipfsHash}`);
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
//need to take from db
  // Open Etherscan with transaction hash
  const openEtherscan = () => {
    if (transactionHash) {
      openCustomWebpage(`https://sepolia.etherscan.io/tx/${transactionHash}`);
    } else {
      // Fallback to main Etherscan if no transaction hash
      openCustomWebpage('https://sepolia.etherscan.io');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content - Left Side */}
      <div className={`${isWebpageOpen ? 'w-1/2' : 'w-full'} container mx-auto p-6 overflow-auto`}>
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
              <p className="text-gray-900">{tokenName ? tokenName : 'do not recieve'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">IPFS Hash:</h3>:
              <p className="text-gray-900 break-all">{ipfsHashParam?ipfsHashParam:'do not receive'}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={openIPFSViewer}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Open IPFS on Right Side
                </button>
                
                <a
                  href={`https://ipfs.io/ipfs/${ipfsHashParam?ipfsHashParam:'do not receive'}`}
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
                <p className="text-gray-900 break-all text-sm font-mono mb-2">{transactionHash || 'do not receive'}</p>
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

            {/* Rest of your existing content */}
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