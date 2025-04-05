'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TransactionHistoryItem, getTransactionHistory, addTransaction } from '../models/history';
import { toast } from 'sonner';
import { AptosAccount } from 'aptos';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  transactionHistory: TransactionHistoryItem[];
  account: AptosAccount | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  getSigningAccount: () => Promise<AptosAccount | null>;
  addTransactionToHistory: (
    type: TransactionHistoryItem['type'],
    title: string,
    description: string,
    transactionHash: string,
    details?: Record<string, any>
  ) => void;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [account, setAccount] = useState<AptosAccount | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load wallet from localStorage on initial render
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;
    
    try {
      const savedWallet = localStorage.getItem('connectedWallet');
      if (savedWallet) {
        setWalletAddress(savedWallet);
      }
    } catch (error) {
      console.error('Error loading wallet from localStorage:', error);
    }
  }, [mounted]);

  // Update transaction history when wallet changes
  useEffect(() => {
    if (!mounted) return;
    
    if (walletAddress) {
      try {
        const history = getTransactionHistory(walletAddress);
        setTransactionHistory(history);
      } catch (error) {
        console.error('Error loading transaction history:', error);
        setTransactionHistory([]);
      }
    } else {
      setTransactionHistory([]);
    }
  }, [walletAddress, mounted]);

  // Get a signing account for transactions
  const getSigningAccount = async (): Promise<AptosAccount | null> => {
    if (!walletAddress || !mounted) {
      return null;
    }

    try {
      // @ts-ignore - Aptos not in global types
      if (typeof window !== 'undefined' && 'aptos' in window) {
        // This is requesting signing capabilities from the wallet
        // @ts-ignore
        const response = await window.aptos.account();
        if (response) {
          return response;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting signing account:', error);
      toast.error("Failed to get signing account from wallet");
      return null;
    }
  };

  const connect = async () => {
    if (walletAddress || !mounted) {
      return; // Already connected or not mounted
    }

    setIsConnecting(true);
    try {
      // Check if Aptos wallet is available in window
      if (typeof window !== 'undefined' && 'aptos' in window) {
        // @ts-ignore - Aptos not in global types
        const response = await window.aptos.connect();
        if (response.address) {
          setWalletAddress(response.address);
          try {
            localStorage.setItem('connectedWallet', response.address);
          } catch (error) {
            console.error('Error saving wallet to localStorage:', error);
          }
          
          // Load transaction history for this wallet
          try {
            const history = getTransactionHistory(response.address);
            setTransactionHistory(history);
          } catch (error) {
            console.error('Error loading transaction history:', error);
          }
          
          toast.success("Wallet connected successfully!");
        } else {
          throw new Error("Failed to get wallet address");
        }
      } else {
        toast.error("Aptos wallet extension not found. Please install Petra, Pontem, or Martian wallet");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (!mounted) return;
    
    setWalletAddress(null);
    setAccount(null);
    try {
      localStorage.removeItem('connectedWallet');
    } catch (error) {
      console.error('Error removing wallet from localStorage:', error);
    }
    setTransactionHistory([]);
    toast.success("Wallet disconnected");
  };

  const addTransactionToHistory = (
    type: TransactionHistoryItem['type'],
    title: string,
    description: string,
    transactionHash: string,
    details?: Record<string, any>
  ) => {
    if (!walletAddress || !mounted) return;
    
    try {
      const newTx = addTransaction(walletAddress, type, title, description, transactionHash, details);
      setTransactionHistory(prev => [newTx, ...prev]);
    } catch (error) {
      console.error('Error adding transaction to history:', error);
    }
  };

  // Avoid rendering children until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const value = {
    walletAddress,
    isConnecting,
    transactionHistory,
    account,
    connect,
    disconnect,
    getSigningAccount,
    addTransactionToHistory
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 