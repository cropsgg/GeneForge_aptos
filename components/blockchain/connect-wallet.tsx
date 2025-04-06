"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from "@/app/context/WalletContext";

export function ConnectWallet() {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const handleConnectToggle = async () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleConnectToggle}
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