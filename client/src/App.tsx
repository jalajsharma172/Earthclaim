import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query"; 
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

import Leaderboard from "./components/Leaderboard";
import Dashboard from "./components/Dashboard";
import Rewards from "./components/Rewards";
import MapView from "./components/MapView"
import NotFound from "./pages/not-found";
import { BrowserStorageService, type UserData } from "@shared/login";
import Home from "./pages/home";
import NFTPolygonViewer from "./components/NFTPolygonViewer";
import { TokenInfoViewer } from './components/TokenInfoViewer.tsx';




function Router() {
  return (
    <Switch>
      <Route path="/">  
        
          <Home />
        
          
         
      </Route>
      <Route path="/map">
        <MapView />
      </Route>
      <Route path="/leaderboard">
        <Leaderboard />
      </Route>
      <Route path="/dashboard">
        <Dashboard />
      </Route>
      <Route path="/earnbywalk">
        <Rewards />
      </Route>
      <Route path="/view-polygon">
        <NFTPolygonViewer />
      </Route>
      <Route path="/token-info/:ipfsHash">
        <TokenInfoViewer />
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider> 
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
