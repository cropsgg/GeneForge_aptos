'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { Types } from 'aptos';
import { CONTRACT_ADDRESS, APTOS_NODE_URL } from '@/lib/contracts/config';
import { TransactionResult } from '@/lib/contracts/types';
import { AptosConnector } from '@/lib/contracts/aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';
import { pollForTransaction, parseAptosError } from "@/lib/contracts/aptos-client";

// Create a singleton connector
const connector = new AptosConnector(Network.DEVNET, CONTRACT_ADDRESS);

interface WalletContextType {
  walletAddress: string | null;
  publicKey: string | null;
  isWalletConnected: boolean;
  network: Network;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  submitTransaction: (payload: Types.EntryFunctionPayload) => Promise<{ hash: string }>;
  checkTransaction: (hash: string) => Promise<{ success: boolean; status: string }>;
  isConnecting: boolean;
  isNetworkConnected: boolean;
  networkName: string;
  getExplorerUrl: (txHash: string) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [network, setNetwork] = useState<Network>(Network.DEVNET);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(false);
  const [networkName, setNetworkName] = useState<string>('');
  
  // Prevent hydration mismatch and initialize values after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if network is connected - only run after mounting and in browser
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;
    
    const checkNetwork = async () => {
      try {
        const connected = await connector.isConnected();
        setIsNetworkConnected(connected);
        if (connected) {
          setNetworkName(connector.getNetworkName());
          
          // If wallet was connected, verify if it's still connected
          if (isWalletConnected && isSafeToAccessWallet()) {
            const walletStillConnected = await window.aptos?.isConnected();
            if (!walletStillConnected) {
              // Wallet disconnected externally
              console.log('Wallet disconnected externally');
              setWalletAddress(null);
              setPublicKey(null);
              setIsWalletConnected(false);
              localStorage.removeItem('connectedWallet');
            }
          }
        }
      } catch (error) {
        console.error('Failed to connect to Aptos network:', error);
        setIsNetworkConnected(false);
      }
    };
    
    // Check network on initial load and periodically
    checkNetwork();
    const intervalId = setInterval(checkNetwork, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [mounted, isWalletConnected]);

  // Load wallet from localStorage on initial render - only run after mounting and in browser
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;
    
    const initializeWallet = async () => {
      try {
        // First check network connection
        const networkConnected = await connector.isConnected();
        setIsNetworkConnected(networkConnected);
        setNetworkName(connector.getNetworkName());
        
        // Only proceed with wallet initialization if network is connected
        if (!networkConnected) {
          console.log('Network not connected, skipping wallet initialization');
          return;
        }
        
        // Check if wallet extension exists
        if (!isSafeToAccessWallet()) {
          console.log('Aptos wallet extension not detected');
          return;
        }
        
        // Try to load from localStorage
        const storedWallet = localStorage.getItem('connectedWallet');
        if (!storedWallet) return;
        
        // Simple reconnection attempt
        try {
          const connected = await window.aptos?.isConnected();
          if (connected) {
            // If connected, reconnect silently
            const account = await window.aptos?.connect();
            if (account && account.address) {
              setWalletAddress(account.address);
              setPublicKey(account.publicKey || null);
              setIsWalletConnected(true);
            }
          } else {
            // Wallet disconnected, clear localStorage
            localStorage.removeItem('connectedWallet');
          }
        } catch (error) {
          console.error('Silent reconnection failed:', error);
          localStorage.removeItem('connectedWallet');
        }
      } catch (error) {
        console.error('Wallet initialization error:', error);
      }
    };

    initializeWallet();
  }, [mounted]);

  // Add a safe wallet check utility function
  const isSafeToAccessWallet = (): boolean => {
    return typeof window !== 'undefined' && !!window.aptos;
  };

  const connectWallet = async () => {
    if (walletAddress || !mounted) {
      return; // Already connected or not mounted
    }

    // First check if network is connected
    if (!isNetworkConnected) {
      toast.error("Network not connected. Please try again later.");
      return;
    }

    setIsConnecting(true);
    try {
      // Check for wallet extension
      if (!isSafeToAccessWallet()) {
        throw new Error('Aptos wallet not found. Please install a compatible wallet extension.');
      }
      
      // Simple connect logic
      const account = await window.aptos?.connect();
      if (!account || !account.address) {
        throw new Error("Failed to connect to wallet");
      }
      
      // Set wallet state
      setWalletAddress(account.address);
      setPublicKey(account.publicKey || null);
      setIsWalletConnected(true);
      
      // Save to localStorage
      localStorage.setItem('connectedWallet', account.address);
      
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!mounted) return;
    
    try {
      // Simple disconnect logic
      if (isSafeToAccessWallet()) {
        await window.aptos?.disconnect();
      }
      
      // Clear all state
      setWalletAddress(null);
      setPublicKey(null);
      setIsWalletConnected(false);
      
      // Remove from localStorage
      localStorage.removeItem('connectedWallet');
      
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Wallet disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  // Submit a transaction to the blockchain
  const submitTransaction = async (
    payload: Types.EntryFunctionPayload,
    options?: {
      simulateOnly?: boolean;
      maxGasAmount?: number;
      gasUnitPrice?: number;
    }
  ): Promise<{ hash: string }> => {
    try {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      
      if (!isNetworkConnected) {
        throw new Error("Network not connected");
      }
      
      // Extract function parts
      const funcParts = payload.function.split('::');
      if (funcParts.length !== 3) {
        throw new Error("Invalid function format. Expected 'address::module::function'");
      }
      
      const [moduleAddress, moduleName, functionName] = funcParts;
      
      // If simulate only, just return success
      if (options?.simulateOnly) {
        return { hash: "simulation-only" };
      }
      
      // Try to simulate the transaction first to catch any potential errors
      try {
        console.log('Attempting to simulate transaction before submission...');
        // We don't actually call simulate here as it's handled by the connector
      } catch (simError) {
        console.error('Transaction simulation failed:', simError);
        
        // Show error toast
        toast.error(`Transaction simulation failed: ${simError instanceof Error ? simError.message : String(simError)}`);
        throw simError;
      }
      
      // Submit the transaction using connector with retry logic
      const result = await connector.submitTransaction(
        walletAddress,
        moduleAddress,
        moduleName,
        functionName,
        payload.type_arguments || [],
        payload.arguments || [],
        {
          maxGasAmount: options?.maxGasAmount,
          gasUnitPrice: options?.gasUnitPrice
        }
      );
      
      // Wait for transaction confirmation
      console.log(`Transaction submitted with hash: ${result.hash}, waiting for confirmation...`);
      const txStatus = await connector.waitForTransaction(result.hash);
      
      if (!txStatus.success) {
        throw new Error(`Transaction failed: ${txStatus.status}`);
      }
      
      return {
        hash: result.hash
      };
    } catch (error) {
      console.error("Error submitting transaction:", error);
      toast.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  
  // Check transaction status
  const checkTransaction = async (txHash: string): Promise<{success: boolean; status: string}> => {
    try {
      const result = await connector.checkTransaction(txHash);
      
      return {
        success: result.success,
        status: result.success ? 'success' : result.status
      };
    } catch (error) {
      console.error(`Error checking transaction ${txHash}:`, error);
      return {
        success: false,
        status: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Get explorer URL for transaction
  const getExplorerUrl = (txHash: string): string => {
    return connector.getExplorerUrl(txHash);
  };

  // Avoid rendering children until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const value: WalletContextType = {
    walletAddress,
    publicKey,
    isWalletConnected,
    network,
    connectWallet,
    disconnectWallet,
    submitTransaction,
    checkTransaction,
    isConnecting,
    isNetworkConnected,
    networkName,
    getExplorerUrl
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 