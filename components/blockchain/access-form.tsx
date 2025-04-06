"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TransactionStatus } from "./transaction-status";
import { useState } from "react";
import { useWallet } from "@/app/context/WalletContext";
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from "@/lib/contracts/config";
import { Types } from "aptos";

const formSchema = z.object({
  userId: z.string().min(2, {
    message: "User ID must be at least 2 characters.",
  }),
  resourceId: z.string().min(1, {
    message: "Resource ID is required.",
  }),
  resourceType: z.string().min(1, {
    message: "Resource type is required.",
  }),
  accessLevel: z.string().min(1, {
    message: "Access level is required.",
  }),
});

export function AccessControlForm() {
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { walletAddress, isWalletConnected, submitTransaction } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      resourceId: "",
      resourceType: "sample",
      accessLevel: "read",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setTransactionStatus("pending");
    try {
      // Convert access level string to number
      const accessLevelMap = {
        read: 1,
        write: 2,
        admin: 3,
      };
      const accessLevel = accessLevelMap[values.accessLevel as keyof typeof accessLevelMap];
      
      // Create the transaction payload
      const payload: Types.EntryFunctionPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAMES.ACCESS_CONTROL}::${FUNCTIONS.GRANT_PERMISSION}`,
        type_arguments: [],
        arguments: [values.userId, parseInt(values.resourceId), accessLevel]
      };
      
      // Submit the transaction
      const result = await submitTransaction(payload);
      
      // Store the transaction hash
      setTransactionHash(result.hash);
      
      setTransactionStatus("success");
      toast.success("Access permission granted successfully!");
      
      // Reset the form
      form.reset({
        userId: "",
        resourceId: "",
        resourceType: "sample",
        accessLevel: "read",
      });
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error(`Failed to grant permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      <div>
        <h3 className="text-xl font-bold">Access Control</h3>
        <p className="text-muted-foreground">
          Grant and manage access permissions to resources on the blockchain
        </p>
      </div>

      {!isWalletConnected && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          Please connect your wallet to manage access permissions on the blockchain.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID/Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x123...abc or user@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    User identifier or wallet address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource ID</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    ID of the resource (sample, data, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="data">Experimental Data</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="ip">Intellectual Property</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of resource to grant access to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Permission level to grant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {transactionStatus !== "idle" && (
            <TransactionStatus 
              status={transactionStatus} 
              transactionHash={transactionHash} 
            />
          )}

          <Button 
            type="submit" 
            disabled={!isWalletConnected || transactionStatus === "pending"}
            className="w-full"
          >
            {transactionStatus === "pending" ? "Granting Permission..." : "Grant Permission"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 