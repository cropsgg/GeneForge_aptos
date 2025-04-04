"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    if (walletAddress) {
      // If already connected, disconnect
      setWalletAddress(null);
      toast.success("Wallet disconnected");
      return;
    }

    setIsConnecting(true);
    try {
      // Check if Aptos wallet is available in window
      if (typeof window !== 'undefined' && 'aptos' in window) {
        // @ts-ignore - Aptos not in global types
        const response = await window.aptos.connect();
        if (response.address) {
          setWalletAddress(response.address);
          toast.success("Aptos wallet connected successfully!");
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

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="group magnetic-button glow-effect"
      >
        <Wallet className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
        {isConnecting ? "Connecting..." : walletAddress ? "Disconnect Wallet" : "Connect Aptos Wallet"}
      </Button>
      {walletAddress && (
        <div className="text-sm text-muted-foreground">
          Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}
    </div>
  );
}