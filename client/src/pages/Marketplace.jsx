import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { useNavigate } from 'react-router-dom';
const Marketplace = ({ marketplace, nft }) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    const loadMarketplaceItems = async () => {
        try {
            console.log("Starting to load marketplace items...");
            console.log("Marketplace contract:", marketplace);
            // Load all unsold items
            const itemCount = await marketplace.itemCount();
            console.log("Total item count:", itemCount.toString());
            let items = [];
            try {
                for (let i = 0; i <= itemCount; i++) {
                    try {
                        const item = await marketplace.items(i);
                        // console.log(`Item ${i}:`, item);
                        if (!item.sold) {
                            const uri = await nft.tokenURI(item.tokenId);
                            // const totalPrice = await marketplace.getTotalPrice(item.itemId);
                            items.push({
                                itemId: item.itemId,
                                price: ethers.formatEther(item.price),
                                seller: item.seller,
                                uri: uri
                            });
                        }
                    }
                    catch (error) {
                        console.log("Error in the loop for item");
                        console.error(`Error in the loop for item${i}:`, error);
                    }
                }
            }
            catch (err) {
            }
            console.log("Processed items:", items);
            // save loaded items to state so UI can render
            setItems(items);
            setLoading(false);
        }
        catch (error) {
            console.error("Error in loadMarketplaceItems:", error);
            setLoading(false); // Set loading to false even on error
        }
    };
    // const buyMarketItem = async (item) => {
    //     await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait()
    //   loadMarketplaceItems();
    // }
    useEffect(() => {
        loadMarketplaceItems();
    }, []);
    if (loading)
        return (<div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className="text-center">
        <div className="text-cyan-400 text-2xl font-mono mb-4">🔄</div>
        <h2 className="text-white text-xl font-mono">LOADING MARKETPLACE...</h2>
      </div>
    </div>);
    return (<div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono border-b-4 border-cyan-400 pb-2 inline-block">
            🏪 MARKETPLACE
          </h1>
          <p className="text-cyan-300 font-mono text-lg">
            Discover and Acquire Digital Territories
          </p>
        </div>

        {items.length > 0 ? (<div className="bg-gray-800 bg-opacity-50 rounded-lg border border-cyan-400 p-6">
            {/* Stats Bar */}
            <div className="bg-black bg-opacity-70 rounded-lg p-4 mb-6 border border-gray-600">
              <div className="flex justify-between text-cyan-400 font-mono text-sm">
                <div>🔄 LIVE LISTINGS</div>
                <div>📊 ITEMS: {items.length}</div>
                <div>⚡ ACTIVE</div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((it, idx) => (<div key={idx} className="bg-gray-800 rounded-lg border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 cursor-pointer group" onClick={() => {
                    const encoded = encodeURIComponent(it.uri);
                    navigate(`/token-info/${encoded}`, {
                        state: {
                            tokenName: it.Name || 'URL Unnamed Token',
                            ipfsHash: it.uri || 'URL undefined',
                            transactionHash: it.transactionHash || 'URL undefined',
                            minted: true,
                            username: 'URL undefined',
                            area: it.area || 'URL area not defined'
                        }
                    });
                }}>
                  <div className="p-4">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-2 py-1">
                        TOKEN #{it.itemId}
                      </div>
                      <div className="text-green-400 text-lg group-hover:scale-110 transition-transform">
                        ⚡
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="mb-3">
                      <div className="text-gray-400 font-mono text-xs uppercase tracking-wide">
                        SELLER
                      </div>
                      <div className="text-white font-mono text-sm truncate">
                        {`${it.seller.substring(0, 6)}...${it.seller.substring(it.seller.length - 4)}`}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-gray-400 font-mono text-xs uppercase tracking-wide">
                        PRICE
                      </div>
                      <div className="text-cyan-300 font-mono text-lg font-bold">
                        {it.price} ETH
                      </div>
                    </div>

                    {/* URI */}
                    <div className="mb-3">
                      <div className="text-gray-400 font-mono text-xs uppercase tracking-wide">
                        TOKEN URI
                      </div>
                      <div className="text-white font-mono text-xs truncate bg-gray-900 p-2 rounded border border-gray-700">
                        {it.uri}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="text-center mt-4">
                      <div className="text-cyan-400 font-mono  text-sm border border-cyan-400 px-3 py-1 inline-block rounded hover:bg-cyan-400 hover:text-gray-900 transition-colors">
                        VIEW DETAILS →
                      </div>
                      <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-3 py-1 inline-block rounded hover:bg-cyan-400 hover:text-gray-900 transition-colors ml-2" onClick={(e) => {
                    e.stopPropagation(); // Stop event from bubbling up
                    navigate("/request", {
                        state: {
                            tokenURI: it.uri,
                            itemId: it.itemId,
                            _price: it.price,
                            seller: it.seller
                        }
                    });
                }}>
                        Send Req
                      </div>
                    </div>
                    
                  </div>
                </div>))}
            </div>
          </div>) : (<div className="text-center py-16">
            <div className="bg-gray-800 bg-opacity-50 rounded-lg border border-cyan-400 p-8 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-2xl font-bold text-white mb-4 font-mono">NO LISTED ASSETS</h2>
              <p className="text-cyan-300 font-mono mb-6">
                The marketplace is currently empty. Be the first to list your digital territory!
              </p>
              <button onClick={() => navigate('/create')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono px-6 py-3 rounded border border-cyan-400 transition-colors">
                CREATE FIRST NFT
              </button>
            </div>
          </div>)}

        {/* Bottom HUD */}
        <div className="mt-8 bg-black bg-opacity-70 rounded-lg border border-cyan-400 py-3">
          <div className="max-w-4xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
            <div>🔄 REAL-TIME SYNC</div>
            <div>🔒 SECURE TRANSACTIONS</div>
            <div>🌐 Ethereum NETWORK</div>
          </div>
        </div>
      </div>
    </div>);
};
export default Marketplace;
