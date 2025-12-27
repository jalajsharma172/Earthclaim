import { ethers } from 'ethers';
let provider = null;
export const initializeProvider = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            // Create ethers provider
            provider = new ethers.BrowserProvider(window.ethereum);
            // Listen for account changes
            window.ethereum.on('accountsChanged', () => {
                provider = new ethers.BrowserProvider(window.ethereum);
            });
            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                provider = new ethers.BrowserProvider(window.ethereum);
            });
            return provider;
        }
        catch (error) {
            console.error('Error initializing provider:', error);
            throw error;
        }
    }
    else {
        throw new Error('Please install MetaMask or another web3 provider');
    }
};
export const getProvider = async () => {
    if (!provider) {
        return await initializeProvider();
    }
    return provider;
};
export const getSigner = async () => {
    const provider = await getProvider();
    return await provider.getSigner();
};
// Get the connected wallet address
export const getAddress = async () => {
    const signer = await getSigner();
    return await signer.getAddress();
};
// Get the current network
export const getNetwork = async () => {
    const provider = await getProvider();
    return await provider.getNetwork();
};
// Helper to check if user is connected
export const isConnected = async () => {
    try {
        await getAddress();
        return true;
    }
    catch {
        return false;
    }
};
