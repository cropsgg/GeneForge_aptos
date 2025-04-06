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
import { Textarea } from "@/components/ui/textarea";
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
import { stringToBytes } from "@/lib/contracts/aptos-client";
import { Types } from "aptos";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  contributorRole: z.string().min(1, {
    message: "Contributor role is required.",
  }),
  contributionDetails: z.string().min(5, {
    message: "Contribution details must be at least 5 characters.",
  }),
  fileHash: z.string().optional(),
});

export function IPForm() {
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const { walletAddress, isWalletConnected, submitTransaction } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      contributorRole: "",
      contributionDetails: "",
      fileHash: "",
    },
  });

  // Function to handle file upload and generate hash
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Show loading indicator
      toast.loading("Generating file hash...");
      
      // Generate a file hash using the crypto API
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Set the hash
      setFileHash(hashHex);
      form.setValue("fileHash", hashHex);
      
      toast.dismiss();
      toast.success("File hash generated successfully!");
    } catch (error) {
      console.error("Error generating file hash:", error);
      toast.error("Failed to generate file hash");
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setTransactionStatus("pending");
    try {
      // Create the transaction payload
      const payload: Types.EntryFunctionPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAMES.INTELLECTUAL_PROPERTY}::${FUNCTIONS.REGISTER_CONTRIBUTION}`,
        type_arguments: [],
        arguments: [
          Array.from(stringToBytes(values.title)),
          Array.from(stringToBytes(values.description)),
          Array.from(stringToBytes(values.contributorRole)),
          Array.from(stringToBytes(values.contributionDetails))
        ]
      };
      
      // Submit the transaction
      const result = await submitTransaction(payload);
      
      // Store the transaction hash
      setTransactionHash(result.hash);
      
      setTransactionStatus("success");
      toast.success("Intellectual property record registered successfully!");
      
      // Reset the form
      form.reset();
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error(`Failed to record IP contribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      <div>
        <h3 className="text-xl font-bold">Intellectual Property Attribution</h3>
        <p className="text-muted-foreground">
          Record intellectual property contributions with blockchain verification
        </p>
      </div>

      {!isWalletConnected && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          Please connect your wallet to record IP contributions on the blockchain.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Patent Title or IP Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Title of the intellectual property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description of the intellectual property" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the IP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contributorRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contributor Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inventor">Inventor</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Role of the contributor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileHash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Hash (Optional)</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="SHA-256 hash of content" 
                          {...field} 
                          value={fileHash || field.value}
                          readOnly
                        />
                      </FormControl>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-24"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Upload
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                    <FormDescription>
                      Upload file to generate content hash for verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contributionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details about your specific contribution" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of your contribution to this IP
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
            {transactionStatus === "pending" ? "Recording Contribution..." : "Record Contribution"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 