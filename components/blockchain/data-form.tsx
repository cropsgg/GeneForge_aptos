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
import { FileText, Upload } from "lucide-react";
import { ExperimentalDataContract } from "@/lib/contracts";
import { createHash } from 'crypto';

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
  version: z.string().min(1, {
    message: "Version is required.",
  }),
  fileHash: z.string().optional(),
});

export function DataForm() {
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const { addTransactionToHistory, getSigningAccount } = useWallet();

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

  const calculateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const buffer = event.target.result as ArrayBuffer;
          const view = new Uint8Array(buffer);
          let hash = 0;
          for (let i = 0; i < view.length; i++) {
            hash = ((hash << 5) - hash) + view[i];
            hash |= 0; // Convert to 32bit integer
          }
          // Convert to hex string prefixed with 0x
          const hexHash = '0x' + Math.abs(hash).toString(16).padStart(8, '0');
          resolve(hexHash);
        } else {
          resolve('0x0');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileSelected(true);
      try {
        const hash = await calculateFileHash(file);
        form.setValue("fileHash", hash);
      } catch (error) {
        console.error("Error hashing file:", error);
        toast.error("Error hashing file");
      }
    } else {
      setFileSelected(false);
      form.setValue("fileHash", "");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setTransactionStatus("pending");
    try {
      // Get signing account from wallet
      const account = await getSigningAccount();
      if (!account) {
        throw new Error("Failed to get signing account from wallet");
      }

      // Ensure we have a file hash
      if (!values.fileHash) {
        throw new Error("File hash is required. Please select a file.");
      }

      // Initialize contract and submit transaction
      const contract = new ExperimentalDataContract();
      const txHash = await contract.submitData(
        account,
        values.fileHash,
        JSON.stringify({
          experimentId: values.experimentId,
          experimentDate: values.experimentDate,
          dataType: values.dataType,
          dataDescription: values.dataDescription,
          version: values.version
        })
      );
      
      setTransactionHash(txHash);
      
      // Add to transaction history
      addTransactionToHistory(
        'data',
        'Data Submission',
        `Submitted ${values.dataType} data for experiment ${values.experimentId}`,
        txHash,
        {
          experimentId: values.experimentId,
          dataType: values.dataType,
          version: values.version,
          fileHash: values.fileHash
        }
      );
      
      setTransactionStatus("success");
      toast.success("Experimental data recorded successfully on blockchain!");
      form.reset();
      setFileSelected(false);
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error("Failed to record experimental data. Please try again.");
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
                  <input type="hidden" {...field} />
                )}
              />
              {fileSelected && (
                <p className="text-xs text-muted-foreground mt-2">
                  File hash will be stored on blockchain. The file itself remains private.
                </p>
              )}
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
            disabled={transactionStatus === "pending"}
            className="w-full"
          >
            {transactionStatus === "pending" ? "Recording Data..." : "Record Data on Blockchain"}
          </Button>
        </form>
      </Form>
    </div>
  );
}