// components/WalletConnector.tsx
"use client";

import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletConnectorProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnect = () => {},
  onDisconnect = () => {},
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [address, setAddress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPopup, setShowPopup] = useState<boolean>(true);

  // Check if wallet is already connected
  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  const checkIfWalletConnected = async () => {
    if (!window.ethereum) {
      return;
    }

    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setConnectionStatus("connected");
        onConnect(userAddress);
        setupListeners();
      }
    } catch (err) {
      console.error("Error checking connected accounts:", err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setConnectionStatus("connecting");
      setError("");

      // This triggers the MetaMask popup
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const userAddress = accounts[0];
      setAddress(userAddress);
      setConnectionStatus("connected");
      setShowPopup(false);
      onConnect(userAddress);

      setupListeners();
    } catch (err: any) {
      console.error("MetaMask connection failed:", err);
      setConnectionStatus("error");
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection request.");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setConnectionStatus("disconnected");
    setError("");
    setShowPopup(true);
    onDisconnect();
  };

  const setupListeners = () => {
    if (!window.ethereum) return;

    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        setAddress(newAddress);
        onConnect(newAddress);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // If not showing popup and already connected, show only disconnect button
  if (!showPopup && connectionStatus === "connected") {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors"
        >
          Disconnect ({formatAddress(address)})
        </button>
      </div>
    );
  }

  // Popup overlay
  if (showPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600">
              Connect your MetaMask wallet to continue
            </p>
          </div>

          {/* MetaMask Option */}
          <div className="space-y-4">
            <button
              onClick={connectWallet}
              disabled={connectionStatus === "connecting"}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🦊</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">MetaMask</div>
                  <div className="text-sm text-gray-500">Connect using browser extension</div>
                </div>
              </div>
              {connectionStatus === "connecting" && (
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Help Text */}
          {!window.ethereum && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">
                Don't have MetaMask installed?
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Install MetaMask →
              </a>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowPopup(false)}
            className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  return null;
};