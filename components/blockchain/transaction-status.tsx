"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionStatusProps {
  status: "pending" | "success" | "error";
  transactionHash?: string | null;
  message?: string;
  className?: string;
}

export function TransactionStatus({
  status,
  transactionHash,
  message,
  className
}: TransactionStatusProps) {
  const statusConfig = {
    pending: {
      icon: Loader2,
      title: "Transaction Pending",
      variant: "default" as const,
      defaultMessage: "Your transaction is being processed on the blockchain..."
    },
    success: {
      icon: CheckCircle2,
      title: "Transaction Successful",
      variant: "default" as const,
      defaultMessage: "Transaction has been successfully recorded on the blockchain!"
    },
    error: {
      icon: XCircle,
      title: "Transaction Failed",
      variant: "destructive" as const,
      defaultMessage: "Failed to complete the transaction. Please try again."
    }
  };

  const config = statusConfig[status];
  const displayMessage = message || config.defaultMessage;

  return (
    <Alert variant={config.variant} className={cn("mt-4", className)}>
      <config.icon className={cn(
        "h-4 w-4",
        status === "pending" && "animate-spin"
      )} />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>
        {displayMessage}
        {transactionHash && (
          <p className="mt-2 text-sm">
            Transaction Hash: <code className="text-xs">{transactionHash}</code>
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}