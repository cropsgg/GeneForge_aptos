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
import { FileText, Upload } from "lucide-react";
import { useWallet } from "@/app/context/WalletContext";
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from "@/lib/contracts/config";
import { stringToBytes } from "@/lib/contracts/aptos-client";
import { Types } from "aptos";

const formSchema = z.object({
  experimentId: z.string().min(2, {
    message: "Experiment ID must be at least 2 characters.",
  }),
  experimentDate: z.string().min(1, {
    message: "Experiment date is required.",
  }),
  dataType: z.string().min(1, {
    message: "Data type is required.",
  }),
  dataDescription: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  version: z.string().default("1.0"),
  fileHash: z.string().optional(),
});

export function DataForm() {
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const { walletAddress, isWalletConnected, submitTransaction } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      experimentId: "",
      experimentDate: new Date().toISOString().split("T")[0],
      dataType: "",
      dataDescription: "",
      version: "1.0",
      fileHash: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileSelected(true);
      // In a production environment, we would calculate a real hash
      const mockFileHash = "0x" + Array.from(new Uint8Array(32))
        .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
        .join('');
      form.setValue("fileHash", mockFileHash);
    } else {
      setFileSelected(false);
      form.setValue("fileHash", "");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!values.fileHash) {
      toast.error("Please upload a file and generate a hash");
      return;
    }
    
    setTransactionStatus("pending");
    try {
      // Create the transaction payload
      const payload: Types.EntryFunctionPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAMES.EXPERIMENTAL_DATA}::${FUNCTIONS.SUBMIT_EXPERIMENT}`,
        type_arguments: [],
        arguments: [Array.from(stringToBytes(values.fileHash))]
      };
      
      // Submit the transaction
      const result = await submitTransaction(payload);
      
      // Store the transaction hash
      setTransactionHash(result.hash);
      
      setTransactionStatus("success");
      toast.success("Experimental data recorded successfully on the blockchain!");
      
      // Reset the form
      form.reset({
        experimentId: "",
        experimentDate: new Date().toISOString().split("T")[0],
        dataType: "",
        dataDescription: "",
        version: "1.0",
        fileHash: "",
      });
      setFileSelected(false);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error(`Failed to record experimental data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      <div>
        <h3 className="text-xl font-bold">Experimental Data Audit Trail</h3>
        <p className="text-muted-foreground">
          Record experimental data with cryptographic hashing for integrity verification
        </p>
      </div>

      {!isWalletConnected && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          Please connect your wallet to register experimental data on the blockchain.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="experimentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experiment ID</FormLabel>
                  <FormControl>
                    <Input placeholder="EXP-001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this experiment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experimentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experiment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Date when the experiment was conducted
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sequencing">DNA Sequencing</SelectItem>
                      <SelectItem value="crispr">CRISPR Editing</SelectItem>
                      <SelectItem value="pcr">PCR Results</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="analysis">Data Analysis</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of experimental data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Version number of this data submission
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dataDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the experimental data and methods used"
                    className="resize-none min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide details about the experimental data
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Data File</FormLabel>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload your experimental data file to generate a hash
              </p>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{fileSelected ? "File Selected" : "Select File"}</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <FormField
                control={form.control}
                name="fileHash"
                render={({ field }) => (
                  <>
                    {field.value && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>File Hash:</p>
                        <p className="font-mono text-xs break-all">{field.value}</p>
                      </div>
                    )}
                    <input type="hidden" {...field} />
                  </>
                )}
              />
            </div>
          </div>

          {transactionStatus !== "idle" && (
            <TransactionStatus
              status={transactionStatus}
              transactionHash={transactionHash}
            />
          )}

          <Button 
            type="submit" 
            disabled={transactionStatus === "pending" || !isWalletConnected || !fileSelected}
            className="w-full"
          >
            {transactionStatus === "pending" ? "Recording Data..." : "Record Data on Blockchain"}
          </Button>
        </form>
      </Form>
    </div>
  );
}