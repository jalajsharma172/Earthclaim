import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { ethers } from 'ethers';
import { ConnectButton, useActiveAccount, useDisconnect } from "thirdweb/react";
import { ChevronDown, LogOut, Disc, Globe, Map as MapIcon, Trophy, ShoppingBag, PlusSquare } from 'lucide-react';
import { thirdwebClient } from '../lib/thirdweb';
import NFTAbi from '../contractsData/NFT.json';
import NFTAddress from '../contractsData/NFT-address.json';
import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import { BrowserStorageService } from '@shared/login';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface NavbarProps {
  setNft: (nft: ethers.Contract) => void;
  setMarketplace: (marketplace: ethers.Contract) => void;
  setAccount: (account: string) => void;
  setUser?: (user: any) => void;
}

const Navbar = ({ setNft, setMarketplace, setAccount, setUser }: NavbarProps) => {
  const [location, navigate] = useLocation();
  const activeAccount = useActiveAccount();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeAccount?.address) {
      setAccount(activeAccount.address);
      loadContracts();
      // Generate random avatar URL using DiceBear API with the wallet address as seed
      setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeAccount.address}`);
    }
  }, [activeAccount]);

  const loadContracts = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get deployed copies of contracts
      const marketplace = new ethers.Contract(
        MarketplaceAddress.address,
        MarketplaceAbi.abi,
        signer
      );
      setMarketplace(marketplace);

      const nft = new ethers.Contract(
        NFTAddress.address,
        NFTAbi.abi,
        signer
      );
      setNft(nft);
    }
  };

  const handleLogout = async () => {
    await BrowserStorageService.clearUserFromStorage();
    if (setUser) {
      setUser(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    setAccount('');
  };

  const NavItem = ({ href, label, icon }: { href: string, label: string, icon: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a className={`group flex items-center gap-2 px-4 py-2 relative transition-all duration-300 ${isActive
            ? 'text-cyan-400 bg-cyan-950/20'
            : 'text-gray-400 hover:text-cyan-300 hover:bg-white/5'
          }`}>
          {/* Active Indicator Line */}
          {isActive && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
          )}

          <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
          </span>
          <span className="font-mono text-xs font-bold tracking-widest">{label}</span>
        </a>
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none bg-gradient-to-b from-black/90 via-black/40 to-transparent backdrop-blur-sm border-b border-white/5">

      {/* Left Section: System Header Style Logo */}
      <div className="flex flex-col pointer-events-auto">
        <Link href="/">
          <a className="group">
            <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] font-mono tracking-tighter">
              EARTH CLAIM
            </h1>
          </a>
        </Link>
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] tracking-[0.3em] mt-0.5 opacity-80">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          SYSTEM ONLINE
        </div>
      </div>

      {/* Center Section: Tab Navigation */}
      <div className="hidden lg:flex items-center pointer-events-auto bg-black/40 backdrop-blur-md rounded border border-white/10 overflow-hidden shadow-lg mx-4">
        <NavItem href="/map" label="MAP" icon={<MapIcon size={14} />} />
        <div className="w-[1px] h-4 bg-white/10"></div>
        <NavItem href="/dashboard" label="DASHBOARD" icon={<Disc size={14} />} />
        <div className="w-[1px] h-4 bg-white/10"></div>
        <NavItem href="/leaderboard" label="LEADERBOARD" icon={<Trophy size={14} />} />
        <div className="w-[1px] h-4 bg-white/10"></div>
        <NavItem href="/marketplace" label="MARKET" icon={<ShoppingBag size={14} />} />
        <div className="w-[1px] h-4 bg-white/10"></div>
        <NavItem href="/create" label="CREATE" icon={<PlusSquare size={14} />} />
      </div>

      {/* Right Section: Wallet & Actions */}
      <div className="flex items-center gap-4 pointer-events-auto">

        {/* Wallet Connection - Geometric Style */}
        {!activeAccount ? (
          <div className="rounded border border-cyan-500/30 overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black/60">
            <ConnectButton
              client={thirdwebClient}
              theme="dark"
              connectButton={{
                label: "CONNECT SYSTEM",
                className: "!font-mono !text-xs !tracking-wider !bg-transparent !text-cyan-400 hover:!bg-cyan-950/50 !border-none !rounded-none !py-2.5 !px-5"
              }}
            />
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-4 py-2 bg-black/60 hover:bg-cyan-950/40 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400/60 transition-all rounded group"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-cyan-500 blur-sm opacity-20 group-hover:opacity-50 transition-opacity"></div>
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="relative w-6 h-6 rounded-full border border-cyan-500/50"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
              </div>

              {/* Address */}
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[9px] text-cyan-500/60 font-mono tracking-widest leading-none">ID-{activeAccount.address.slice(2, 6).toUpperCase()}</span>
                <span className="text-gray-300 font-mono text-xs tracking-wider group-hover:text-white transition-colors">
                  {`${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}`}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-cyan-500/20 shadow-2xl rounded overflow-hidden z-50">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                <div className="p-3 border-b border-white/5">
                  <div className="text-[10px] text-cyan-600 font-mono tracking-widest mb-1">CURRENT SESSION</div>
                  <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                    <Globe size={12} className="text-cyan-500" />
                    EARTH CLAIM NETWORK
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-950/20 transition-colors font-mono text-xs tracking-wide text-left text-gray-400 hover:text-red-400 rounded-sm group"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    DISCONNECT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Logout */}
        <button
          onClick={() => {
            handleLogout();
            navigate('/');
          }}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-800 hover:border-red-500/30 hover:bg-red-950/10 text-gray-500 hover:text-red-400 transition-colors"
          title="System Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;