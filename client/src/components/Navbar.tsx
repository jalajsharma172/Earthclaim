import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ethers } from 'ethers';
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
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userAccount, setUserAccount] = useState('');
  const [, navigate] = useLocation();

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    setUserAccount(accounts[0]);
    setAccount(accounts[0]);
    setConnected(true);
    
    // Get provider from Metamask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    window.ethereum.on('chainChanged', (chainId: string) => {
      window.location.reload();
    });

    window.ethereum.on('accountsChanged', async function (accounts: string[]) {
      setUserAccount(accounts[0]);
      setAccount(accounts[0]);
      await web3Handler();
    });

    // Load contracts
    loadContracts(signer);
  };

  const loadContracts = async (signer: ethers.Signer) => {
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
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await BrowserStorageService.clearUserFromStorage();
    if (setUser) {
      setUser(null);
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <a className="text-xl font-bold">GeoClaimer</a>
        </Link>
        <Link href="/map">
          <a className="hover:text-gray-300">Map</a>
        </Link>
        <Link href="/dashboard">
          <a className="hover:text-gray-300">Dashboard</a>
        </Link>
        <Link href="/leaderboard">
          <a className="hover:text-gray-300">Leaderboard</a>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <Link href="/marketplace">
          <a className="hover:text-gray-300">Marketplace</a>
        </Link>
        <Link href="/create">
          <a className="hover:text-gray-300">Create NFT</a>
        </Link>
        <button
          onClick={web3Handler}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
        >
          {connected ? 
            `Connected: ${userAccount.slice(0,6)}...${userAccount.slice(-4)}` : 
            'Connect Wallet'}
        </button>
        <button
          onClick={()=>{
            handleLogout();
            navigate('/');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;