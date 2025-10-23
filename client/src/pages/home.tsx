import { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import Login from "@/pages/login"; 
import {BrowserStorageService} from '@shared/login'
 interface UserData {
  username: string
  useremail: string
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [homepage, setHomepage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await BrowserStorageService.getUserFromStorage();
        if (storedUser != null) {
          setUser(storedUser);
          setHomepage(true);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Add listener for login success
  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    setHomepage(true);
  };


if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!homepage || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  return (
    
    <div className="h-screen w-screen bg-gradient-to-br from-blue-100 to-green-100 overflow-auto">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
        <div className="text-2xl font-bold text-blue-700">Territory Walker</div>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => navigate("/map")}  
          >
            Open Map
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={() => navigate("/leaderboard")}
          >
            See Leaderboard
          </button>
          <button
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={()=>{
            if ('Notification' in window) {
                new Notification('metamask is not ready');
                alert('metamask is not ready');
            } else {
                console.log('This browser does not support notifications');
            }

            }}
          >
            Connect Wallet
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            onClick={async ()=>{
              // delete local storage and update UI immediately
              await BrowserStorageService.clearUserFromStorage();
              setUser(null);
              navigate('/'); // or '/login'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Info Section */}
      <section className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">
          Welcome to Territory Walker!
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/ https://app.emergent.sh/
          
          Territory Walker is a geospatial tracking app where you can log your
          walks, claim areas, and compete for achievements. Track your paths,
          visualize your territory, and see how you rank on the leaderboard!
        </p>
        <ul className="list-disc ml-6 text-gray-600 mb-4">
          <li>Real-time GPS tracking and path recording</li>
          <li>Claim 10-meter radius areas as you walk</li>
          <li>Visualize your travel history and achievements</li>
          <li>Compete with others on the leaderboard</li>
          <li>Connect your wallet for future rewards</li>
        </ul>
        <div className="mt-6 text-gray-500 text-sm">
          <strong>Tip:</strong> Click "Open Map" to start tracking your territory!
        </div>
      </section>

    
    </div>
  );
}




 
