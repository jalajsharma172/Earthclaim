import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Gift, ShoppingCart, CreditCard, Smartphone, Trophy, Star, Clock } from "lucide-react";
const mockOffers = [
    {
        id: '1',
        title: 'Survey Router - Unlimited',
        provider: 'Cint',
        description: 'Complete surveys to earn rewards',
        pointsValue: 175000,
        category: 'survey',
        icon: '📊',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        requirements: 1,
        estimatedTime: '10-15 min',
        featured: true,
        available: true
    },
    {
        id: '2',
        title: 'Crypto Research Router',
        provider: 'Catalyse',
        description: 'Research cryptocurrency projects',
        pointsValue: 480,
        category: 'crypto',
        icon: '₿',
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        requirements: 1,
        estimatedTime: '5-10 min',
        available: true
    },
    {
        id: '3',
        title: 'Mobile Gaming Rewards',
        provider: 'LootUp',
        description: 'Play mobile games and earn',
        pointsValue: 175000,
        category: 'gaming',
        icon: '🎮',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        requirements: 2,
        estimatedTime: '20-30 min',
        available: true
    },
    {
        id: '4',
        title: 'NFT Staking Rewards',
        provider: 'Magnet Miner',
        description: 'Stake your NFTs for passive income',
        pointsValue: 5302150,
        category: 'crypto',
        icon: '🧲',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        requirements: 3,
        featured: true,
        available: true
    },
    {
        id: '5',
        title: 'Garden Gnome Challenge',
        provider: 'Garden Gnome',
        description: 'Complete garden building tasks',
        pointsValue: 3908800,
        category: 'gaming',
        icon: '🌻',
        color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        requirements: 2,
        available: true
    },
    {
        id: '6',
        title: 'Forest Conservation',
        provider: 'Forest Cleaner',
        description: 'Environmental action rewards',
        pointsValue: 5817000,
        category: 'survey',
        icon: '🌲',
        color: 'bg-gradient-to-r from-green-600 to-teal-500',
        requirements: 4,
        available: true
    },
    {
        id: '7',
        title: 'Trading Simulator',
        provider: 'XM 360',
        description: 'Learn trading with virtual money',
        pointsValue: 39550,
        category: 'financial',
        icon: '📈',
        color: 'bg-gradient-to-r from-indigo-500 to-blue-600',
        requirements: 1,
        available: true
    },
    {
        id: '8',
        title: 'Video Chat Rewards',
        provider: 'Chamet',
        description: 'Social interaction rewards',
        pointsValue: 44100,
        category: 'app',
        icon: '💬',
        color: 'bg-gradient-to-r from-pink-500 to-rose-500',
        requirements: 1,
        available: true
    }
];
export default function Rewards() {
    const [offers, setOffers] = useState(mockOffers);
    const [userRewards, setUserRewards] = useState([]);
    const [userNFTCount, setUserNFTCount] = useState(0);
    const [userNFTData, setUserNFTData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    // Get current user info from localStorage (same as Dashboard)
    const getCurrentUser = () => {
        try {
            const savedUser = localStorage.getItem('territoryWalkerUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                console.log("Retrieved username from localStorage:", parsed.username);
                return parsed?.username || "Anonymous";
            }
        }
        catch (error) {
            console.error("Error retrieving username from localStorage:", error);
        }
        // console.log("No username found in localStorage, using 'Anonymous'");
        return "Guest"; // Default to Guest to allow access
    };
    const currentUsername = getCurrentUser();
    useEffect(() => {
        loadUserData();
    }, []);
    const loadUserData = async () => {
        // if (currentUsername === "Anonymous") return; // Removed check
        setLoading(true);
        try {
            // Load user's actual NFT data from existing API (same as Dashboard)
            const response = await fetch(`/api/user-nfts/username/${encodeURIComponent(currentUsername)}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Fetched NFTs for rewards:", data.userNFTs);
                setUserNFTData(data.userNFTs);
                // Count NFTs that are minted and not used for rewards
                const availableNFTs = data.userNFTs.filter((nft) => nft.minted === 1 && !nft.usedForReward);
                setUserNFTCount(availableNFTs.length);
                console.log("Available NFTs for rewards:", availableNFTs.length);
            }
            else {
                console.log("Failed to fetch NFTs, using demo data");
                // Fallback - simulate having some NFTs for demo
                setUserNFTCount(3);
                setUserNFTData([]);
            }
            setUserRewards([]);
            setOffers(mockOffers);
        }
        catch (error) {
            console.error("Error loading user data:", error);
            // Fallback - simulate having some NFTs for demo
            setUserNFTCount(3);
            setUserNFTData([]);
            setError("Using demo data - could not connect to server");
        }
        finally {
            setLoading(false);
        }
    };
    const formatPoints = (points) => {
        if (points >= 1000000) {
            return `${(points / 1000000).toFixed(1)}M`;
        }
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}K`;
        }
        return points.toLocaleString();
    };
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'survey': return <Star className="w-4 h-4"/>;
            case 'app': return <Smartphone className="w-4 h-4"/>;
            case 'financial': return <CreditCard className="w-4 h-4"/>;
            case 'gaming': return <Trophy className="w-4 h-4"/>;
            case 'shopping': return <ShoppingCart className="w-4 h-4"/>;
            case 'crypto': return <Coins className="w-4 h-4"/>;
            default: return <Gift className="w-4 h-4"/>;
        }
    };
    const handleClaimReward = async (offer) => {
        // if (currentUsername === "Anonymous") {
        //   setError("Please login to claim rewards");
        //   return;
        // }
        const availableNFTs = userNFTData.filter(nft => nft.minted === 1 && !nft.usedForReward);
        if (availableNFTs.length < offer.requirements) {
            setError(`You need at least ${offer.requirements} NFTs to claim this reward. You currently have ${availableNFTs.length} available NFTs.`);
            return;
        }
        setSelectedOffer(offer.id);
        setError("");
        setSuccess("");
        try {
            // Simulate claiming process
            await new Promise(resolve => setTimeout(resolve, 2000));
            const newReward = {
                id: Date.now().toString(),
                userId: currentUsername,
                offerId: offer.id,
                pointsEarned: offer.pointsValue,
                status: 'completed',
                createdAt: new Date().toISOString()
            };
            setUserRewards((prev) => [...prev, newReward]);
            setSuccess(`Successfully claimed ${formatPoints(offer.pointsValue)} points from ${offer.title}!`);
            // Update NFT data (mark NFTs as used for reward)
            const nftsToUse = availableNFTs.slice(0, offer.requirements);
            const updatedNFTData = userNFTData.map(nft => {
                if (nftsToUse.find(usedNft => usedNft.id === nft.id)) {
                    return { ...nft, usedForReward: 1 };
                }
                return nft;
            });
            setUserNFTData(updatedNFTData);
            setUserNFTCount((prev) => Math.max(0, prev - offer.requirements));
        }
        catch (error) {
            console.error("Error claiming reward:", error);
            setError("Failed to claim reward. Please try again.");
        }
        finally {
            setSelectedOffer(null);
        }
    };
    const canClaimOffer = (offer) => {
        return userNFTCount >= offer.requirements && offer.available;
    };
    // Removed Login Required Screen
    // if (currentUsername === "Anonymous") { ... }
    return (<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            Complete Offers to Earn Rewards
          </h1>
          <p className="text-purple-600 text-lg">
            Convert your NFTs into valuable rewards and earn points
          </p>

          {/* User Stats */}
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg inline-block">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">{userNFTCount}</div>
                <div className="text-sm text-gray-600">Available NFTs</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userRewards.length}</div>
                <div className="text-sm text-gray-600">Rewards Claimed</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPoints(userRewards.reduce((sum, reward) => sum + reward.pointsEarned, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (<Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>)}

        {success && (<Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>)}

        {/* User's Available NFTs Section */}
        {/* Removed check: currentUsername !== "Anonymous" */}
        {userNFTData.length > 0 && (<div className="mb-8 bg-white rounded-3xl shadow-xl p-6 border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">Your Available NFTs</h2>
            <p className="text-purple-600 mb-4">These NFTs can be used to claim rewards</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userNFTData
                .filter(nft => nft.minted === 1 && !nft.usedForReward)
                .map((nft, idx) => (<div key={nft.id} className="bg-purple-50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-purple-800">Land NFT #{idx + 1}</div>
                      <Badge className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 font-mono break-all">
                      Hash: {nft.hashjson.length > 30 ? `${nft.hashjson.substring(0, 30)}...` : nft.hashjson}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created: {new Date(nft.createdAt).toLocaleDateString()}
                    </div>
                  </div>))}
            </div>

            {userNFTData.filter(nft => nft.minted === 1 && !nft.usedForReward).length === 0 && (<div className="text-center py-8 text-gray-500">
                <p>No available NFTs for rewards</p>
                <p className="text-sm mt-1">Create more territories in MapView to earn NFTs!</p>
              </div>)}
          </div>)}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (<Card key={offer.id} className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${offer.featured ? 'ring-2 ring-purple-400 ring-opacity-50' : ''} ${!canClaimOffer(offer) ? 'opacity-60' : ''}`}>
              {offer.featured && (<div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500 text-yellow-900">
                    Featured
                  </Badge>
                </div>)}

              <CardHeader className={`${offer.color} text-white relative`}>
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{offer.icon}</div>
                  <div className="flex items-center gap-1 text-white/80">
                    {getCategoryIcon(offer.category)}
                    <span className="text-xs capitalize">{offer.category}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{offer.title}</CardTitle>
                <CardDescription className="text-white/90 text-sm">
                  {offer.provider}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Reward:</span>
                    <span className="font-bold text-green-600">
                      +{formatPoints(offer.pointsValue)} points
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Required NFTs:</span>
                    <span className="font-semibold text-purple-600">
                      {offer.requirements} NFT{offer.requirements > 1 ? 's' : ''}
                    </span>
                  </div>

                  {offer.estimatedTime && (<div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time:</span>
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Clock className="w-3 h-3"/>
                        {offer.estimatedTime}
                      </span>
                    </div>)}
                </div>

                <Button onClick={() => handleClaimReward(offer)} disabled={!canClaimOffer(offer) || selectedOffer === offer.id} className={`w-full mt-4 ${canClaimOffer(offer)
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-400 cursor-not-allowed'}`}>
                  {selectedOffer === offer.id ? (<div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>) : !canClaimOffer(offer) ? (userNFTCount < offer.requirements ?
                `Need ${offer.requirements - userNFTCount} more NFT${offer.requirements - userNFTCount > 1 ? 's' : ''}` :
                'Unavailable') : ('Claim Reward')}
                </Button>
              </CardContent>
            </Card>))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-3xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-purple-600"/>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Earn NFTs</h3>
              <p className="text-gray-600 text-sm">
                Create territories in MapView to generate your NFTs
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-green-600"/>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Choose Offers</h3>
              <p className="text-gray-600 text-sm">
                Select from various offers that match your NFT count
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coins className="w-8 h-8 text-blue-600"/>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Get Rewards</h3>
              <p className="text-gray-600 text-sm">
                Convert your NFTs to points and valuable rewards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
