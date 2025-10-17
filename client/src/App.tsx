import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query"; 
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Login from "@/pages/login";
import Leaderboard from "./components/Leaderboard";
import Dashboard from "./components/Dashboard";
import Rewards from "./components/Rewards";
import MapView from "./components/MapView"
import NotFound from "./pages/not-found";
import { BrowserStorageService, type UserData } from "@shared/login";
import Home from "./pages/home";
import NFTPolygonViewer from "./components/NFTPolygonViewer";



function Router() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await BrowserStorageService.getUserFromStorage();
      if (storedUser!=null) setUser(storedUser);
      setIsLoading(false);
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">
            Loading Territory Walker...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
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

      <Route path="/">
        {user ? (
          <Home />
        ) : (
          <Login 
          />
        )}
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
