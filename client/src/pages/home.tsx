import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "@/pages/login"; 
import { BrowserStorageService } from '@shared/login'

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

    // Update coordinates on mouse move for scanner effect
    const handleMouseMove = (e: MouseEvent) => {
      setCoordinates({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

        {/* Scanner Line */}
        <div 
          className="absolute w-full h-1 bg-cyan-400 opacity-60"
          style={{
            top: `${coordinates.y}px`,
            boxShadow: '0 0 20px 5px rgba(0, 255, 255, 0.7)',
            transition: 'top 0.1s ease-out'
          }}
        ></div>
      </div>

      {/* All Text Content - Higher z-index to ensure it's on top */}
      <div className="relative z-10 h-full w-full">
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 z-20">
          <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-2 py-1">
            ◤ SECTOR: ALPHA ◢
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-2 py-1">
            ◤ USER: {user.username} ◢
          </div>
        </div>

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
            <h1 className="text-6xl font-bold text-white mb-4 tracking-wider font-mono border-4 border-cyan-400 inline-block px-8 py-4 relative">
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
          
          {/* Menu Items with Gaming Icons */}
          <div className="space-y-3 bg-black bg-opacity-50 p-6 rounded-lg border border-cyan-400 relative">
            {/* Menu Corner Decorations */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

            {/* Menu Items */}
            <button 
              onClick={() => navigate('/map')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🗺️</span>
              <span className="text-xl font-mono">[MAP] EXPLORE TERRITORIES</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              onClick={() => navigate('/leaderboard')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🏆</span>
              <span className="text-xl font-mono">[RANK] LEADERBOARD</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">📊</span>
              <span className="text-xl font-mono">[STATS] DASHBOARD</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              onClick={() => navigate('/marketplace')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🏪</span>
              <span className="text-xl font-mono">[TRADE] MARKETPLACE</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              onClick={() => navigate('/create')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">⚡</span>
              <span className="text-xl font-mono">[FORGE] CREATE NFT</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              onClick={() => navigate('/leaderboard')}
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🐛</span>
              <span className="text-xl font-mono">[REPORT] FOUND A BUG?</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>

            <button 
              className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">⭐</span>
              <span className="text-xl font-mono">[RATE] RATE GAME</span>
              <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </button>
          </div>

          {/* Mission Briefing */}
          <div className="text-center mt-8">
            <div className="text-cyan-300 font-mono text-sm border border-cyan-400 inline-block px-4 py-2">
              🎯 MISSION: CONQUER TERRITORIES • ACCUMULATE RESOURCES • DOMINATE LEADERBOARDS
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
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Login from "@/pages/login"; 
// import { BrowserStorageService } from '@shared/login'

// interface UserData {
//   username: string
//   useremail: string
// }

// export default function Home() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState<UserData | null>(null);
//   const [homepage, setHomepage] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [videoError, setVideoError] = useState(false);
//   const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const storedUser = await BrowserStorageService.getUserFromStorage();
//         if (storedUser != null) {
//           setUser(storedUser);
//           setHomepage(true);
//         }
//       } catch (error) {
//         console.error("Error loading user:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadUser();

//     // Update coordinates on mouse move for scanner effect
//     const handleMouseMove = (e: MouseEvent) => {
//       setCoordinates({
//         x: e.clientX,
//         y: e.clientY
//       });
//     };

//     window.addEventListener('mousemove', handleMouseMove);
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, []);

//   const handleLoginSuccess = (userData: UserData) => {
//     setUser(userData);
//     setHomepage(true);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen bg-gray-900">
//         <div className="text-center">
//           <div className="text-4xl mb-4">🛸</div>
//           <div className="text-white text-xl font-mono">INITIALIZING SYSTEM...</div>
//           <div className="text-cyan-400 text-sm mt-2 font-mono">Loading Earth Claim v2.0</div>
//         </div>
//       </div>
//     );
//   }

//   if (!homepage || !user) {
//     return <Login onLoginSuccess={handleLoginSuccess} />;
//   }
  
//   return (
//     <div className="h-screen w-screen overflow-auto relative bg-gray-900">
//       {/* Video Background */}
//       <div className="fixed inset-0 z-0">
//         <video  
//           autoPlay
//           muted
//           loop
//           playsInline
//           className="absolute inset-0 w-full h-full object-cover"
//           style={{ pointerEvents: 'none' }}
//           onError={(e) => {
//             console.error('Video failed to load', e)
//             setVideoError(true)
//           }}
//         >
//           <source src="/homeanimation.mp4" type="video/mp4" />
//           Your browser does not support the video tag.
//         </video>

//         {/* Sci-fi Overlay */}
//         <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
//         {/* Grid Overlay */}
//         <div className="absolute inset-0 opacity-20">
//           <div className="w-full h-full" style={{
//             backgroundImage: `
//               linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
//               linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
//             `,
//             backgroundSize: '50px 50px'
//           }}></div>
//         </div>

//         {/* Scanner Line */}
//         <div 
//           className="absolute w-full h-1 bg-cyan-400 opacity-60 z-10"
//           style={{
//             top: `${coordinates.y}px`,
//             boxShadow: '0 0 20px 5px rgba(0, 255, 255, 0.7)',
//             transition: 'top 0.1s ease-out'
//           }}
//         ></div>
//       </div>

//       {/* Corner Brackets */}
//       <div className="absolute top-0 left-0 z-20">
//         <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-2 py-1">
//           ◤ SECTOR: ALPHA ◢
//         </div>
//       </div>

//       <div className="absolute top-4 right-4 z-20">
//         <div className="text-cyan-400 font-mono text-sm border border-cyan-400 px-2 py-1">
//           ◤ USER: {user.username} ◢
//         </div>
//       </div>

//       <div className="absolute bottom-4 left-4 z-20">
//         <div className="text-cyan-400 font-mono text-sm">
//           COORD: {coordinates.x}.{coordinates.y}
//         </div>
//       </div>

//       <div className="absolute bottom-4 right-4 z-20">
//         <div className="text-cyan-400 font-mono text-sm">
//           STATUS: ONLINE 🟢
//         </div>
//       </div>

//       {/* Video Error Message */}
//       {videoError && (
//         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded bg-red-600 text-white shadow">
//           ⚠️ Video failed to load. Make sure <code>/homeanimation.mp4</code> exists.
//         </div>
//       )}

//       {/* Enhanced Game Menu Section */}
//       <section className="max-w-3xl mx-auto mt-20 relative z-10">
//         {/* Game Title with Sci-fi Styling */}
//         <div className="text-center mb-12">
//           <h1 className="text-6xl font-bold text-white mb-4 tracking-wider font-mono border-4 border-cyan-400 inline-block px-8 py-4 relative">
//             EARTH CLAIM
//             <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
//             <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
//             <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
//             <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
//           </h1>
//           <div className="text-cyan-300 text-lg font-mono mt-4">
//             ⚡ TERRITORY CONQUEST SYSTEM v2.0 ⚡
//           </div>
//         </div>
        
//         {/* Menu Items with Gaming Icons */}
//         <div className="space-y-3 bg-black bg-opacity-50 p-6 rounded-lg border border-cyan-400 relative">
//           {/* Menu Corner Decorations */}
//           <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
//           <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
//           <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
//           <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

//           {/* Menu Items */}
//           <button 
//             onClick={() => navigate('/map')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🗺️</span>
//             <span className="text-xl font-mono">[MAP] EXPLORE TERRITORIES</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             onClick={() => navigate('/leaderboard')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🏆</span>
//             <span className="text-xl font-mono">[RANK] LEADERBOARD</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             onClick={() => navigate('/dashboard')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">📊</span>
//             <span className="text-xl font-mono">[STATS] DASHBOARD</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             onClick={() => navigate('/marketplace')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🏪</span>
//             <span className="text-xl font-mono">[TRADE] MARKETPLACE</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             onClick={() => navigate('/create')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">⚡</span>
//             <span className="text-xl font-mono">[FORGE] CREATE NFT</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             onClick={() => navigate('/leaderboard')}
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">🐛</span>
//             <span className="text-xl font-mono">[REPORT] FOUND A BUG?</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>

//           <button 
//             className="w-full bg-gray-800 hover:bg-cyan-700 text-white p-4 flex items-center rounded border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-105 group"
//           >
//             <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">⭐</span>
//             <span className="text-xl font-mono">[RATE] RATE GAME</span>
//             <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
//           </button>
//         </div>

//         {/* Mission Briefing */}
//         <div className="text-center mt-8">
//           <div className="text-cyan-300 font-mono text-sm border border-cyan-400 inline-block px-4 py-2">
//             🎯 MISSION: CONQUER TERRITORIES • ACCUMULATE RESOURCES • DOMINATE LEADERBOARDS
//           </div>
//         </div>
//       </section>

//       {/* Bottom HUD */}
//       <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-70 border-t border-cyan-400 py-2 z-20">
//         <div className="max-w-3xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
//           <div>ACTIVE USERS: 1,247</div>
//           <div>TERRITORIES CLAIMED: 89,456</div>
//           <div>SERVER: STABLE</div>
//         </div>
//       </div>
//     </div>
//   );
// }
// // import { useState ,useEffect} from "react";
// // import { useNavigate } from "react-router-dom"; // Add this import
// // import Login from "@/pages/login"; 
// // import {BrowserStorageService} from '@shared/login'
// //  interface UserData {
// //   username: string
// //   useremail: string
// // }

// // export default function Home() {
// //   const navigate = useNavigate();
// //   const [user, setUser] = useState<UserData | null>(null);
// //   const [homepage, setHomepage] = useState(false);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [videoError, setVideoError] = useState(false);

// //   useEffect(() => {
// //     const loadUser = async () => {
// //       try {
// //         const storedUser = await BrowserStorageService.getUserFromStorage();
// //         if (storedUser != null) {
// //           setUser(storedUser);
// //           setHomepage(true);
// //         }
// //       } catch (error) {
// //         console.error("Error loading user:", error);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     loadUser();
// //   }, []);

// //   // Add listener for login success
// //   const handleLoginSuccess = (userData: UserData) => {
// //     setUser(userData);
// //     setHomepage(true);
// //   };


// // if (isLoading) {
// //     return (
// //       <div className="flex justify-center items-center h-screen">
// //         <div>Loading...</div>
// //       </div>
// //     );
// //   }

// //   if (!homepage || !user) {
// //     return <Login onLoginSuccess={handleLoginSuccess} />;
// //   }
  
// //   return (
// //     <div className="h-screen w-screen overflow-auto relative">
// //       {/* Video Background */}
// //       <div className="fixed inset-0 z-0 ">
// //         <video  
// //           autoPlay
// //           muted
// //           loop
// //           playsInline
// //           className="absolute inset-0 w-full h-full object-cover"
// //           style={{ pointerEvents: 'none' }}
// //           onError={(e) => {
// //             console.error('Video failed to load', e)
// //             setVideoError(true)
// //           }}
// //         >
// //           <source src="/homeanimation.mp4" type="video/mp4" />
// //           Your browser does not support the video tag.
// //         </video>

// //         {/* Optional: Overlay to improve text readability */}
// //         <div className="absolute inset-0 bg-black bg-opacity-30"></div>
// //       </div>
// //       {/* If the video failed to load, show a small helpful message */}
// //       {videoError && (
// //         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded bg-red-600 text-white shadow">
// //           Video failed to load. Make sure <code>/homeanimation.mp4</code> exists in the project's <code>public/</code> folder and reload.
// //         </div>
// //       )}

// //       {/* Game Menu Section */}
// //       <section className="max-w-3xl mx-auto mt-12 relative z-10">
// //         <h1 className="text-4xl font-bold text-white text-center mb-8">
// //           Earth Claim
// //         </h1>
        
// //         <div className="space-y-2">
// //           {/* Menu Items */}
// //           <button 
// //             onClick={() => navigate('/map')}
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //           >
// //             <span className="material-icons mr-4">play_arrow</span>
// //             <span className="text-xl">Map</span>
// //           </button>

// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //              onClick={() => navigate('/leaderboard')}
// //           >
// //             <span className="material-icons mr-4">help</span>
// //             <span className="text-xl">Leaderboard</span>
// //           </button>

// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //               onClick={() => navigate('/dashboard')}
// //           >
// //             <span className="material-icons mr-4">info</span>
// //             <span className="text-xl">Dashboard</span>
// //           </button>

// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //               onClick={() => navigate('/marketplace')}
// //           >
// //             <span className="material-icons mr-4">settings</span>
// //             <span className="text-xl">Marketplace</span>
// //           </button>
// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //               onClick={() => navigate('/create')}
// //           >
// //             <span className="material-icons mr-4">bug_report</span>
// //             <span className="text-xl">Create NFT</span>
// //           </button>
// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //               onClick={() => navigate('/leaderboard')}
// //           >
// //             <span className="material-icons mr-4">bug_report</span>
// //             <span className="text-xl">Found a bug?</span>
// //           </button>


// //           <button 
// //             className="w-full bg-teal-500 hover:bg-teal-400 text-white p-4 flex items-center rounded transition-colors"
// //           >
// //             <span className="material-icons mr-4">star_rate</span>
// //             <span className="text-xl">Rate game</span>
// //           </button>
// //         </div>
// //       </section>
// //     </div>
// //   );

// // }




 
