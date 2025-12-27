import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThreeEarth from "../components/ThreeEarth";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Radio } from "lucide-react";
import MeteorShower from "../components/MeteorShower";
import IPFSCard from "../components/IPFSCard";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "../lib/thirdweb";
import { BrowserStorageService } from "@shared/login";
import { getUserEmail } from "thirdweb/wallets/in-app";
export default function Home() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
    const activeAccount = useActiveAccount();
    // Stop music when wallet connects
    useEffect(() => {
        if (activeAccount && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsMusicPlaying(false);
        }
    }, [activeAccount]);
    // Handle Thirdweb Login
    useEffect(() => {
        const performLogin = async () => {
            if (activeAccount?.address) {
                let email = "";
                try {
                    // Attempt to fetch email from in-app wallet (Google, etc.)
                    email = await getUserEmail({ client: thirdwebClient });
                    console.log("Fetched email from Thirdweb:", email);
                }
                catch (e) {
                    console.log("Could not fetch email or not an in-app wallet:", e);
                }
                try {
                    const response = await axios.post("/api/auth/login", {
                        walletAddress: activeAccount.address,
                        email: email || undefined,
                        // Use email as username if available, otherwise fallback or let server handle it
                        username: email ? email.split('@')[0] : undefined
                    });
                    if (response.data.user) {
                        console.log("Logged in user:", response.data.user);
                        await BrowserStorageService.saveUserToStorage(response.data.user);
                    }
                }
                catch (error) {
                    console.error("Failed to login with wallet:", error);
                }
            }
        };
        performLogin();
    }, [activeAccount]);
    // Scroll and Meteor state
    const [showMeteors, setShowMeteors] = useState(false);
    const containerRef = useRef(null);
    // Audio state
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef(null);
    useEffect(() => {
        // Simulate system initialization
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);
    // Handle scroll to trigger meteor shower
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const scrollTop = containerRef.current.scrollTop;
                // Trigger meteors when user starts scrolling down
                if (scrollTop > 50) {
                    setShowMeteors(true);
                }
                else {
                    setShowMeteors(false);
                }
            }
        };
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isLoading]);
    // Get location coordinates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!navigator.geolocation)
                return;
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                console.log("✅ Location found:", latitude, longitude);
                setCoordinates({ x: latitude, y: longitude });
                try {
                    await axios.post("/api/save-coordinates", {
                        username: "Guest",
                        latitude: latitude,
                        longitude: longitude
                    });
                }
                catch (e) {
                    console.error("Failed to save coordinates", e);
                }
            }, (error) => {
                console.error("Geolocation error:", error);
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, []);
    const toggleMusic = () => {
        if (!audioRef.current)
            return;
        if (isMusicPlaying) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
        }
        else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            setIsMusicPlaying(true);
        }
    };
    const stopMusic = () => {
        if (!audioRef.current)
            return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsMusicPlaying(false);
    };
    if (isLoading) {
        return (<div className="flex justify-center items-center h-screen bg-gray-900 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full" style={{
                backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}></div>
        </div>
        <div className="text-center relative z-50">
          <div className="text-6xl mb-6 animate-bounce">🛸</div>
          <div className="text-cyan-400 text-2xl font-mono tracking-[0.2em] animate-pulse">INITIALIZING SYSTEM...</div>
          <div className="w-64 h-2 bg-gray-800 rounded-full mt-4 mx-auto overflow-hidden border border-cyan-500/30">
            <div className="h-full bg-cyan-500 animate-[width_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>);
    }
    return (<div ref={containerRef} className="h-screen w-screen overflow-y-auto relative bg-gray-900 text-white selection:bg-cyan-500/30 scroll-smooth">

      {/* Meteor Shower - Triggered on Scroll - Behind Earth */}
      <AnimatePresence>
        {showMeteors && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 pointer-events-none z-0">
            <MeteorShower />
          </motion.div>)}
      </AnimatePresence>

      {/* Background Music */}
      <audio ref={audioRef} loop>
        <source src="/race1.mp3" type="audio/mp3"/>
      </audio>

      {/* 3D Earth Background - Fixed - In Front of Meteors */}
      <div className="fixed inset-0 z-10">
        <ThreeEarth />
      </div>

      {/* Grid Overlay for Sci-Fi Effect - Fixed */}
      <div className="fixed inset-0 pointer-events-none z-20 opacity-15">
        <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
        }}></div>
      </div>

      {/* Vignette & Scanlines - Fixed */}
      <div className="fixed inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
      <div className="fixed inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>


      {/* Main Content Layer - Extended Height for Scrolling */}
      <div className="relative z-30 min-h-[200vh] w-full flex flex-col p-6 md:p-12">

        {/* Top Header Area - Fixed */}
        <header className="fixed top-0 left-0 w-full p-6 md:p-12 flex justify-between items-start pointer-events-auto z-50 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] font-mono tracking-tighter">
              EARTH CLAIM
            </h1>
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-[0.3em] mt-1 opacity-80">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              SYSTEM ONLINE
            </div>
          </div>

          {/* Wallet & Music Controls */}
          <div className="flex gap-4 items-center">
            {/* Wallet Connection */}
            <div className="rounded border border-cyan-500/30 overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black/60" onClickCapture={() => {
            // Start music when user clicks to connect
            if (!activeAccount && !isMusicPlaying && audioRef.current) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                setIsMusicPlaying(true);
            }
        }}>
              <ConnectButton client={thirdwebClient} theme="dark" connectButton={{
            label: "CONNECT SYSTEM",
            className: "!font-mono !text-xs !tracking-wider !bg-transparent !text-cyan-400 hover:!bg-cyan-950/50 !border-none !rounded-none !py-2.5 !px-5"
        }}/>
            </div>

            <button onClick={toggleMusic} className={`p-3 rounded-full border ${isMusicPlaying ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30' : 'border-gray-600 text-gray-400 bg-black/40'} backdrop-blur-md hover:scale-110 transition-all duration-300 group`}>
              {isMusicPlaying ? <Volume2 size={24} className="animate-pulse"/> : <VolumeX size={24}/>}
            </button>
            {isMusicPlaying && (<button onClick={stopMusic} className="p-3 rounded-full border border-red-500/50 text-red-400 bg-red-950/20 backdrop-blur-md hover:scale-110 transition-all duration-300 hover:bg-red-900/40">
                <div className="w-3 h-3 bg-current rounded-[1px]"></div>
              </button>)}
          </div>
        </header>

        {/* Center/Main Action Area - First Screen */}
        <main className="h-screen flex items-center justify-end md:justify-end relative mt-20">

          {/* Navigation Array - Floating Left Center - Fixed Position relative to viewport */}
          <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 pointer-events-auto z-40">
            {[
            { label: 'LEADERBOARD', path: '/leaderboard', icon: '🏆' },
            { label: 'MAP VIEW', path: '/map', icon: '🗺️' },
            { label: 'MARKETPLACE', path: '/marketplace', icon: '🏪' }
        ].map((item, index) => (<motion.button key={item.label} initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1, type: "spring" }} onClick={() => navigate(item.path)} className="group relative pl-8 pr-12 py-4 bg-black/40 hover:bg-cyan-950/40 backdrop-blur-md border-l-4 border-gray-700 hover:border-cyan-400 text-left transition-all duration-300 overflow-hidden skew-x-[-10deg] ml-4">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="skew-x-[10deg] flex items-center gap-4">
                  <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-gray-400 group-hover:text-cyan-300 font-mono text-xs tracking-widest transition-colors mb-1">MODULE_0{index + 1}</span>
                    <span className="text-white font-bold font-mono text-lg tracking-wider group-hover:translate-x-1 transition-transform">{item.label}</span>
                  </div>
                </div>
              </motion.button>))}
          </div>

          <div className="flex flex-col items-end mr-4 mt-20 gap-6">
            {/* Earn by Walk Card - Right Side */}
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-1 rounded-2xl max-w-sm">
              <div className="bg-gray-900/80 rounded-xl p-6 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-cyan-400 text-xs font-mono tracking-widest mb-1">ACTIVE MISSION</span>
                    <h2 className="text-3xl font-bold text-white italic">EARN BY WALK</h2>
                  </div>
                  <Radio className="text-cyan-400 animate-pulse"/>
                </div>

                <p className="text-gray-400 mb-6 font-mono text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
                  Initialize movement protocols. <span className="text-white">Generate ECM tokens</span> by traversing physical space.
                </p>

                <div className="flex justify-between items-center text-xs font-mono text-cyan-300/70 mb-6 bg-black/40 p-2 rounded">
                  <span>RATE: 1 STEP</span>
                  <span>=</span>
                  <span className="text-cyan-300 font-bold">0.05 ECM</span>
                </div>

                <button onClick={() => navigate('/earnbywalk')} className="w-full py-4 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 group/btn relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 tracking-wider">INITIATE</span>
                  <span className="relative z-10 group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </motion.div>

            {/* IPFS Card */}
            <IPFSCard />
          </div>
        </main>

        {/* Second Screen Content (Downward) */}
        <div className="h-screen flex items-center justify-center relative">
          <div className="text-center bg-black/50 backdrop-blur-md p-8 rounded-xl border border-white/10">
            <h2 className="text-3xl font-mono text-cyan-400 mb-4 animate-pulse">DEEP SPACE EXPLORATION</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              You are now viewing the outer sectors. Scrolling deeper reveals the meteor shower phenomenon.
            </p>
          </div>
        </div>

        {/* Footer HUD - Fixed Bottom */}
        <footer className="fixed bottom-0 left-0 w-full p-6 md:p-12 flex justify-between items-end pointer-events-none text-xs font-mono text-cyan-500/60 z-50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
              LAT: {coordinates.x.toFixed(6)}
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
              LNG: {coordinates.y.toFixed(6)}
            </div>
          </div>

          <div className="text-right">
            <div className="mb-1 opacity-50">SECURE CONNECTION</div>
            <div className="text-cyan-400 font-bold tracking-widest text-lg">v3.0.0</div>
          </div>
        </footer>

      </div>
    </div>);
}
