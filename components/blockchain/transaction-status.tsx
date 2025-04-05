"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { APTOS_NODE_URL } from "@/lib/contracts/config";

// Determine explorer URL based on node URL
const getExplorerUrl = (txHash: string | null) => {
  if (!txHash) return null;
  
  // Determine which network we're on
  if (APTOS_NODE_URL.includes('devnet')) {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=devnet`;
  } else if (APTOS_NODE_URL.includes('testnet')) {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`;
  } else {
    return `https://explorer.aptoslabs.com/txn/${txHash}`;
  }
};

interface TransactionStatusProps {
  status: "pending" | "success" | "error";
  transactionHash: string | null;
}

export function TransactionStatus({
  status,
  transactionHash,
}: TransactionStatusProps) {
  const explorerUrl = getExplorerUrl(transactionHash);

  return (
    <div
      className={`flex items-center p-4 rounded-md border ${
        status === "success"
          ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
          : status === "error"
          ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
          : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
      }`}
    >
      {status === "pending" ? (
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
      ) : status === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
      )}
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            status === "success"
              ? "text-green-700 dark:text-green-300"
              : status === "error"
              ? "text-red-700 dark:text-red-300"
              : "text-blue-700 dark:text-blue-300"
          }`}
        >
          {status === "pending"
            ? "Transaction processing..."
            : status === "success"
            ? "Transaction successful!"
            : "Transaction failed"}
        </p>
        {transactionHash && (
          <p className="text-xs text-muted-foreground mt-1">
            Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-6)}
            {explorerUrl && (
              <Link 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 underline text-primary hover:text-primary/80"
              >
                View on Aptos Explorer
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}