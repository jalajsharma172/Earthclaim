import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";
import Leaderboard from "./components/Leaderboard";
import Dashboard from "./components/Dashboard";
import Rewards from "./components/Rewards";
import MapView from "./components/MapView";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import NFTPolygonViewer from "./components/NFTPolygonViewer";
import { TokenInfoViewer } from './components/TokenInfoViewer.tsx';
import Marketplace from './pages/Marketplace.tsx';
import Create from "./pages/Create.tsx";
import Request from "./pages/Request.tsx";
function App() {
    const [account, setAccount] = useState(null);
    const [nft, setNft] = useState(null);
    const [marketplace, setMarketplace] = useState(null);
    const [user, setUser] = useState(null);
    return (<ThirdwebProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-900">
            <Switch>
              <Route path="/">
                <Home />
              </Route>
              <Route path="/map">
                <MapView />
              </Route>
              <Route>
                {/* All other pages with navbar and container */}
                <div>
                  <Navbar setNft={setNft} setMarketplace={setMarketplace} setAccount={setAccount} setUser={setUser}/>
                  <main className="container mx-auto px-4 py-8">
                    <Switch>
                      <Route path="/leaderboard">
                        <Leaderboard />
                      </Route>
                      <Route path="/dashboard">
                        <Dashboard account={account}/>
                      </Route>
                      <Route path="/earnbywalk">
                        <Rewards />
                      </Route>
                      <Route path="/view-polygon">
                        <NFTPolygonViewer />
                      </Route>
                      <Route path="/token-info/:ipfsHash">
                        <TokenInfoViewer nft={nft}/>
                      </Route>
                      <Route path="/marketplace">
                        <Marketplace marketplace={marketplace} nft={nft}/>
                      </Route>
                      <Route path="/create">
                        <Create marketplace={marketplace} nft={nft} account={account}/>
                      </Route>
                      <Route path="/request">
                        <Request marketplace={marketplace} nft={nft}/>
                      </Route>

                      <Route>
                        <NotFound />
                      </Route>
                    </Switch>
                  </main>
                </div>
              </Route>
            </Switch>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThirdwebProvider>);
}
export default App;
