// src/components/MenuBar.tsx
import { useNavigate } from "react-router-dom";

interface MenuBarProps {
  username: string;
  onLogout: () => void;
}

export default function MenuBar({ username, onLogout }: MenuBarProps) {
  const navigate = useNavigate();

  const navItems = [
    { name: "Map", path: "/map" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Marketplace", path: "/marketplace" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-black bg-opacity-70 border-b border-cyan-400 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="text-cyan-400 font-mono text-lg font-bold cursor-pointer hover:text-white transition"
        >
          ⚡ EARTH CLAIM
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="text-gray-300 hover:text-cyan-400 font-mono text-sm tracking-widest transition"
            >
              [{item.name.toUpperCase()}]
            </button>
          ))}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="text-cyan-300 font-mono text-sm">
            USER: {username? username: "no user found"}
          </div>
          <button
            onClick={onLogout}
            className="text-red-400 hover:text-white font-mono text-sm border border-red-400 px-3 py-1 rounded transition"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}
