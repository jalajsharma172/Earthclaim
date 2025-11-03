import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "@/pages/login"; 
import { BrowserStorageService } from '@shared/login' 
import MenuBar from "../components/Menubar";
import axios from "axios";
interface UserData {
  username: string
  useremail: string
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [homepage, setHomepage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  

  useEffect(() => {
const loadUser = async () => {
  try {
    const storedUser = await BrowserStorageService.getUserFromStorage();
    console.log("Raw stored user data:", storedUser);
    
    // Fix: The data is nested inside userData property
    const userData = storedUser?.userData;
    console.log("Extracted user data:", userData);
    
    if (userData) {
      const username = userData.username;
      const useremail = userData.useremail;
      console.log("Username:", username);
      console.log("Useremail:", useremail);
      
      setUser({
        username: username,
        useremail: useremail
      });
      setHomepage(true);
    } else {
      console.log("No user data found in storage");
    }
  } catch (error) {
    console.error("Error loading user:", error);
  } finally {
    setIsLoading(false);
  }
};

    loadUser();
  }, []);


  


  // Get location coordinates
 setTimeout(() => { 
    if (!user) return;
    const timer = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
          async (position) => {
      const { latitude, longitude } = position.coords;
      console.log("✅ Location found:", latitude, longitude);
      setCoordinates({x:latitude,y:longitude});
      const save_response=await axios.post("/api/save-coordinates",{
        username:user.username?user.username:"no user",
        latitude:latitude,
        longitude:longitude
      });
      if(save_response){
        console.log("Saved . ");
        console.log("Saved Response -",user," ",latitude," & ",longitude," . ");


      }else{
        console.log("Not Saved . ");
      }
 
            },
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error("❌ User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        console.error("📡 Location information is unavailable.");
        break;
      case error.TIMEOUT:
        console.error("⏰ The request to get user location timed out.");
        break;
      default:
        console.error("⚠️ An unknown error occurred:", error.message);
        break;
    }
    }
  );
      }, 1000); // 1 second delay

}, 3000);









  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    setHomepage(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-center relative z-50">
          <div className="text-4xl mb-4">🛸</div>
          <div className="text-white text-xl font-mono">INITIALIZING SYSTEM...</div>
          <div className="text-cyan-400 text-sm mt-2 font-mono">Loading Earth Claim v2.0</div>
        </div>
      </div>
    );
  }

  if (!homepage || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  return (
    <div className="h-screen w-screen overflow-auto relative bg-gray-900">

      <MenuBar username={user.username} onLogout={() => {
        BrowserStorageService.clearUser();
        setUser(null);
        setHomepage(false);
        navigate("/login");
      }} />
      
      {/* Video Background - Fixed with proper z-index */}
      <div className="fixed inset-0 z-0">
        <video  
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
          onError={(e) => {
            console.error('Video failed to load', e)
            setVideoError(true)
          }}
        >
          <source src="/homeanimation.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Sci-fi Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* All Text Content - Higher z-index to ensure it's on top */}
      <div className="relative z-10 h-full w-full">
        <div className="absolute bottom-4 left-4 z-20">
          <div className="text-cyan-400 font-mono text-sm">
            COORD: {coordinates.x}.{coordinates.y}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-20">
          <div className="text-cyan-400 font-mono text-sm">
            STATUS: ONLINE 🟢
          </div>
        </div>

        {/* Video Error Message */}
        {videoError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded bg-red-600 text-white shadow">
            ⚠️ Video failed to load. Make sure <code>/homeanimation.mp4</code> exists.
          </div>
        )}

        {/* Enhanced Game Menu Section */}
        <section className="max-w-3xl mx-auto pt-20 relative">
          {/* Game Title with Sci-fi Styling */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-wider font-mono border-4 border-cyan-400 inline-block px-8 py-4 relative">
              EARTH CLAIM
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
            </h1>
            <div className="text-cyan-300 text-lg font-mono mt-4">
              ⚡ TERRITORY CONQUEST SYSTEM v2.0 ⚡
            </div>
          </div>
        </section>

        {/* Bottom HUD */}
        <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-70 border-t border-cyan-400 py-2 z-20">
          <div className="max-w-3xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
            <div>ACTIVE USERS: 1,247</div>
            <div>TERRITORIES CLAIMED: 89,456</div>
            <div>SERVER: STABLE</div>
          </div>
        </div>
      </div>



    </div>
  );
}
